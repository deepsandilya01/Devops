import crypto from "crypto";
import {
  CloneRepo,
  detectRepoType,
  deployStatic,
  deployFrontend,
  deployBackend,
  deployFullstack,
} from "../utils/deploy.utils.js";
import {
  extractTechStack,
  findEntryPoints,
  analyzeFolders,
  extractRepoName,
} from "../utils/repo.utils.js";
import {
  redeployRunningProject,
  redeployFailedProject,
} from "../utils/redeploy.utils.js";
import { generateAISummary } from "../services/ai.service.js";
import envModel from "../model/env.model.js";
import fs from "fs";
import path from "path";
import Project from "../model/project.model.js";
import ProjectAnalysis from "../model/project.summery.js";
import config from "../config/config.js";
import { execAsync } from "../utils/deploy.utils.js";
import {
  getCacheOrExecute,
  invalidateCache,
  setCacheValue,
  invalidateCachePattern,
} from "../utils/cache.utils.js";

export async function deployProject(req, res, next) {
  const { repoUrl, env = null } = req.body;
  const userToken = req.user.githubAccessToken
  console.log(req.user)
  console.log("============================")
  console.log(userToken)
  try {
    const repo = await Project.findOne({ repoUrl, status: "running" });

    if (repo) {
      return next({
        status: 409,
        message: "Repo already exists with this URL",
      });
    }
    const appId = crypto.randomBytes(3).toString("hex");

    // Ensure logs directory exists and create initial log file
    const logDir = "logs";
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.writeFileSync(
      `${logDir}/${appId}.log`,
      `[SYS] Starting deployment for ${repoUrl}...\n`,
    );

    const path =
      config.NODE_ENV === "production"
        ? `/home/ubuntu/temp/app_${appId}`
        : `/temp/app_${appId}`;
    // saving the initial stage of repo while deploying
    await Project.create({
      appId,
      user: req.user.id,
      repoUrl,
      status: "building",
      port: 404,
      containerID: "",
      type: {
        RepoType: "null",
        structure: [],
      },
    });

    await envModel.create({
      user: req.user.id,
      appId,
      env: env || {},
    });

    fs.appendFileSync(`logs/${appId}.log`, `[SYS] Cloning repository...\n`);

    const result = await CloneRepo(path, repoUrl,userToken);
    console.log("result", result);
    if (!result.success) {
      fs.appendFileSync(
        `logs/${appId}.log`,
        `[ERROR] Clone failed: ${result.message}\n`,
      );
      await Project.findOneAndUpdate({ appId }, { status: "failed" });
      return next({ status: 400, message: result.message });
    }
    fs.appendFileSync(
      `logs/${appId}.log`,
      `[SYS] Repository cloned successfully.\n`,
    );

    //detecting type of repo
    const repoType = await detectRepoType(path);
    const { RepoType: type } = repoType;

    fs.appendFileSync(
      `logs/${appId}.log`,
      `[SYS] Detected project type: ${type}\n`,
    );

    if (type === "nextjs") {
      fs.appendFileSync(
        `logs/${appId}.log`,
        `[ERROR] Nextjs projects are not supported yet.\n`,
      );
      await Project.findOneAndUpdate({ appId }, { status: "failed" });
      return next({
        status: 400,
        message: "Nextjs projects are not supported yet",
      });
    }
    console.log(type, "type of repo");
    fs.appendFileSync(
      `logs/${appId}.log`,
      `[SYS] Starting Docker build process...\n`,
    );
    let DockerResult;
    try {
      switch (type) {
        case "static":
          DockerResult = await deployStatic(path, appId);
          break;
        case "frontend":
          DockerResult = await deployFrontend(path, appId);
          break;
        case "backend":
          DockerResult = await deployBackend(path, appId, env);
          break;
        case "fullstack":
          DockerResult = await deployFullstack(path, appId, env);
          break;
        default:
          fs.appendFileSync(
            `logs/${appId}.log`,
            `[ERROR] Invalid repo type: ${type}\n`,
          );
          await Project.findOneAndUpdate({ appId }, { status: "failed" });
          return next({ status: 400, message: "Invalid repo type" });
      }
      console.log(DockerResult, "docker result");
      console.log(DockerResult.containerId, "container id");
      fs.appendFileSync(
        `logs/${appId}.log`,
        `[SYS] Docker deployment successful! Container ID: ${DockerResult.containerId.substring(0, 12)} on Port: ${DockerResult.port}\n`,
      );
      const updateProject = await Project.findOneAndUpdate(
        { appId, status: "building" },
        {
          status: "running",
          containerID: DockerResult.containerId,
          port: DockerResult.port,
          type: repoType,
        },
      );

      res.status(201).json({
        success: true,
        repoUrl,
        appId,
        containerId: DockerResult.containerId,
        liveUrl:
          config.NODE_ENV === "production"
            ? `https://${appId}.quicklive.tech/`
            : `http://${appId}.127.0.0.1.nip.io:3000/`,
      });
    } catch (err) {
      console.error("Deployment Error:", err);

      await Project.findOneAndUpdate(
        { appId },
        { status: "failed", type: repoType },
      );
      return next({
        status: err.response?.status || 500,
        message:
          err.response?.data?.message ||
          err.message ||
          "Internal server error during deployment",
      });
    }
  } catch (err) {
    console.error("Deployment Error:", err);
    return next({
      status: err.response?.status || 500,
      message:
        err.response?.data?.message ||
        err.message ||
        "Internal server error during deployment",
    });
  }
}
export async function getLogs(req, res, next) {
  try {
    const { appId } = req.params;
    const project = await Project.findOne({ appId });
    if (!project) {
      return next({ status: 404, message: "Project not found" });
    }
    const logPath = `logs/${appId}.log`;
    if (!fs.existsSync(logPath)) {
      return next({ status: 404, message: "Log file not found" });
    }
    const logs = fs.readFileSync(logPath, "utf-8");
    res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    return next({
      status: 500,
      message: error.message || "Failed to read logs",
    });
  }
}

export async function streamLogs(req, res) {
  const { appId } = req.params;
  const logPath = `logs/${appId}.log`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Send all existing log content immediately
  if (fs.existsSync(logPath)) {
    const existing = fs.readFileSync(logPath, "utf-8");
    if (existing) {
      res.write(`data: ${JSON.stringify({ logs: existing })}\n\n`);
    }
  }

  let lastSize = fs.existsSync(logPath) ? fs.statSync(logPath).size : 0;

  // Poll for new bytes every 500ms
  const interval = setInterval(() => {
    try {
      if (!fs.existsSync(logPath)) return;
      const stat = fs.statSync(logPath);
      if (stat.size > lastSize) {
        const fd = fs.openSync(logPath, "r");
        const buf = Buffer.alloc(stat.size - lastSize);
        fs.readSync(fd, buf, 0, buf.length, lastSize);
        fs.closeSync(fd);
        lastSize = stat.size;
        const newContent = buf.toString("utf-8");
        if (newContent) {
          res.write(`data: ${JSON.stringify({ append: newContent })}\n\n`);
        }
      }
    } catch (_) {}
  }, 500);

  req.on("close", () => clearInterval(interval));
}

export async function getProjects(req, res) {
  try {
    const projects = await Project.find({ user: req.user.id });
    res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    return next({
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.message ||
        "Something went wrong",
    });
  }
}

export async function getProjectByAppId(req, res, next) {
  try {
    const { appId } = req.params;
    const project = await Project.findOne({ appId, user: req.user.id });

    if (!project) {
      return next({ status: 404, message: "Project not found" });
    }

    const envData = await envModel.findOne({ user: req.user.id, appId });
    const envCount = envData?.env ? Object.keys(envData.env).length : 0;

    // Try to read log file size
    let logSize = 0;
    try {
      const logPath = `logs/${appId}.log`;
      if (fs.existsSync(logPath)) {
        const stats = fs.statSync(logPath);
        logSize = stats.size;
      }
    } catch (e) {
      /* ignore */
    }

    // Fetch AI Summary from ProjectAnalysis with caching
    let aiSummary = "No AI summary available for this project.";
    try {
      const cacheKey = `project_analysis:${project.repoUrl}`;
      const analysis = await getCacheOrExecute(
        cacheKey,
        86400, // Cache for 24 hours
        () =>
          ProjectAnalysis.findOne({
            repoUrl: project.repoUrl,
            user: req.user.id,
          }),
      );
      if (analysis && analysis.summary) {
        aiSummary = analysis.summary;
      }
    } catch (e) {
      console.error("Error fetching AI summary:", e);
    }

    res.status(200).json({
      success: true,
      project: {
        ...project.toObject(),
        envCount,
        logSize,
        aiSummary,
      },
    });
  } catch (error) {
    return next({
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.message ||
        "Something went wrong",
    });
  }
}

export async function getContainerStats(req, res, next) {
  try {
    const { appId } = req.params;
    const project = await Project.findOne({ appId, user: req.user.id });

    if (!project) {
      return next({ status: 404, message: "Project not found" });
    }

    if (!project.containerID || project.status !== "running") {
      return res.status(200).json({
        success: true,
        stats: null,
        message: "Container is not running",
      });
    }

    try {
      const { stdout } = await execAsync(
        `docker stats ${project.containerID} --no-stream --format "{{json .}}"`,
      );
      const parsed = JSON.parse(stdout.trim());
      res.status(200).json({
        success: true,
        stats: {
          cpuPercent: parsed.CPUPerc,
          memUsage: parsed.MemUsage,
          memPercent: parsed.MemPerc,
          netIO: parsed.NetIO,
          blockIO: parsed.BlockIO,
          pids: parsed.PIDs,
        },
      });
    } catch (dockerErr) {
      res.status(200).json({
        success: true,
        stats: null,
        message: "Could not fetch container stats",
      });
    }
  } catch (error) {
    return next({
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.message ||
        "Something went wrong",
    });
  }
}

/**
 * Analyzes a GitHub repository and stores structured information
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.repoUrl - GitHub repository URL
 * @param {Object} req.user - Authenticated user
 * @param {string} req.user.id - User ID
 * @param {Object} res - Express response object
 */
export async function analyzeRepo(req, res, next) {
  const { repoUrl } = req.body;

  // Validation
  if (!repoUrl || typeof repoUrl !== "string") {
    return next({
      status: 400,
      message: "repoUrl is required and must be a string",
    });
  }

  const projectAnalysis = await getCacheOrExecute(
    `project_analysis:${repoUrl}`,
    86400, // Cache for 24 hours
    () => ProjectAnalysis.findOne({ repoUrl: repoUrl }),
  );

  if (projectAnalysis) {
    return res.status(200).json({
      success: true,
      message: "Repository analyzed successfully (fetched)",
      data: {
        _id: projectAnalysis._id,
        repoName: projectAnalysis.repoName,
        repoUrl: projectAnalysis.repoUrl,
        summary: projectAnalysis.summary,
        techStack: projectAnalysis.techStack,
        entryPoints: projectAnalysis.entryPoints,
        folderExplanation: projectAnalysis.folderExplanation,
        createdAt: projectAnalysis.createdAt,
      },
    });
  }

  let tempDir = null;

  try {
    // Generate unique temp directory for this analysis
    const analysisId = crypto.randomBytes(4).toString("hex");
    tempDir = path.join(
      config.NODE_ENV === "production" ? "/home/ubuntu/temp" : "/temp",
      `analysis_${analysisId}`,
    );

    // Clone the repository
    const cloneResult = await CloneRepo(tempDir, repoUrl);

    if (!cloneResult.success) {
      return next({
        status: 400,
        message: `Failed to clone repository: ${cloneResult.message}`,
      });
    }

    // Extract repository name from URL
    const repoName = extractRepoName(repoUrl);

    // Extract tech stack from package.json
    const techStack = extractTechStack(tempDir);

    // Find entry points
    const entryPoints = findEntryPoints(tempDir);

    // Analyze folder structure
    const folderExplanation = analyzeFolders(tempDir);

    // Generate beginner-friendly summary using AI
    let summary;
    try {
      summary = await generateAISummary({
        repoName,
        techStack,
        entryPoints,
        folderExplanation,
      });
    } catch (aiError) {
      console.warn(
        "AI summary generation failed, using fallback:",
        aiError.message,
      );
      summary = `Project "${repoName}" - A repository with ${techStack.length} dependencies. Main entry points: ${entryPoints.length > 0 ? entryPoints.join(", ") : "None detected"}.`;
    }

    // Create and save the analysis document
    const analysisDoc = await ProjectAnalysis.create({
      user: req.user.id,
      repoUrl,
      repoName,
      techStack,
      entryPoints,
      folderExplanation,
      summary,
    });

    // Cache the newly created analysis
    await setCacheValue(
      `project_analysis:${repoUrl}`,
      analysisDoc,
      86400, // 24 hours
    );

    // Return success response
    res.status(201).json({
      success: true,
      message: "Repository analyzed successfully",
      data: {
        _id: analysisDoc._id,
        repoName: analysisDoc.repoName,
        repoUrl: analysisDoc.repoUrl,
        summary: analysisDoc.summary,
        techStack: analysisDoc.techStack,
        entryPoints: analysisDoc.entryPoints,
        folderExplanation: analysisDoc.folderExplanation,
        createdAt: analysisDoc.createdAt,
      },
    });
  } catch (error) {
    console.error("Repository analysis error:", error);

    return next({
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.message ||
        "Failed to analyze repository",
    });
  } finally {
    // Cleanup: Remove temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error(
          "Error cleaning up temp directory:",
          cleanupError.message,
        );
      }
    }
  }
}

export async function getProjectSummery(req, res, next) {
  try {
    const { id } = req.params;

    const analysis = await ProjectAnalysis.findById(id).populate(
      "user",
      "name email",
    );

    if (!analysis) {
      return next({ status: 404, message: "Project analysis not found" });
    }

    // Verify ownership
    if (analysis.user._id.toString() !== req.user.id) {
      return next({
        status: 403,
        message: "Unauthorized to access this analysis",
      });
    }

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Error fetching project summary:", error);
    return next({
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.message ||
        "Something went wrong",
    });
  }
}

export async function deleteProject(req, res, next) {
  try {
    const { appId } = req.body;
    const project = await Project.findOne({ appId, user: req.user.id });

    if (!project) {
      return next({ status: 404, message: "Project not found" });
    }

    // Try to cleanup docker container and image forcefully
    try {
      if (project.containerID) {
        await execAsync(`docker rm -f ${project.containerID}`).catch(() => {});
      }
      await execAsync(`docker rmi -f app_${appId}`).catch(() => {});
    } catch (err) {
      console.log("Docker cleanup error ignored during delete:", err.message);
    }

    // Cleanup logs
    try {
      if (fs.existsSync(`logs/${appId}.log`)) {
        fs.unlinkSync(`logs/${appId}.log`);
      }
    } catch (err) {
      console.log("Log cleanup error ignored:", err.message);
    }

    // Delete from DB
    await Project.findByIdAndDelete(project._id);
    await envModel.findOneAndDelete({ user: req.user.id, appId });

    // Invalidate cache for this project's analysis
    await invalidateCache(`project_analysis:${project.repoUrl}`);

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    return next({
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.message ||
        "Something went wrong",
    });
  }
}

export async function redeployProject(req, res, next) {
  try {
    const { appId, env } = req.body;
    const userToken = req.user.githubAccessToken
    const project = await Project.findOne({ appId, user: req.user.id });

    if (!project) {
      return next({ status: 404, message: "Project not found" });
    }

    if (project.status === "suspended") {
      return next({
        status: 400,
        message: "Project is suspended and cannot be redeployed",
      });
    }

    if (project.status === "building" || project.status === "redeploying") {
      return next({
        status: 400,
        message: "Project is already building or redeploying",
      });
    }

    // Set status to redeploying
    await Project.findByIdAndUpdate(project._id, { status: "redeploying" });
    const envVal = await envModel.findOne({ user: req.user.id, appId });
    const targetEnv = env ? env : envVal?.env;

    let reDeployed;
    if (project.status === "running") {
      console.log("Redeploying running project...");
      reDeployed = await redeployRunningProject(project, targetEnv,userToken);
    } else {
      // 'failed'
      console.log("Redeploying failed project...");
      reDeployed = await redeployFailedProject(project, targetEnv,userToken);
    }

    if (!reDeployed.success) {
      await Project.findByIdAndUpdate(project._id, { status: "failed" });
      return next({ status: 500, message: reDeployed.message });
    }

    res.status(200).json({
      success: true,
      message: "Project redeployed successfully",
      info: reDeployed,
    });
  } catch (error) {
    return next({
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.message ||
        "Something went wrong",
    });
  }
}
