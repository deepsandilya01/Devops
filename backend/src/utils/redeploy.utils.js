import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import net from "net";
import Project from "../model/project.model.js";
import {
  CloneRepo,
  deployBackend,
  deployFrontend,
  deployStatic,
  deployFullstack,
  detectRepoType,
} from "./deploy.utils.js";
import config from "../config/config.js";

export const execAsync = promisify(exec);

export async function deleteOldContainerAndImage(containerId, imageName) {
  try {
    await execAsync(`docker rm -f ${containerId}`);
    // We do not delete the image by name here because the new build reuses the same tag name.
    // The old image becomes dangling and can be cleaned up later via docker image prune.
    return true;
  } catch (err) {
    console.log("err in deleting old container and image", err);
    return false;
  }
}

export async function redeployRunningProject(project, env, userToken) {
  console.log("Project",project)
  console.log("user token in redeploy", userToken);
  console.log(`/home/ubuntu/temp/app_${project.appId}`, project.repoUrl, userToken)
  const result = await CloneRepo(`/home/ubuntu/temp/app_${project.appId}`, project.repoUrl, userToken);
  console.log(result)
  if (!result.success) {
    return { success: false, message: result.message };
  }
  const repoType = await detectRepoType(
    config.NODE_ENV === "production"
      ? `/home/ubuntu/temp/app_${project.appId}`
      : `/temp/app_${project.appId}`,
  );
  console.log(repoType, "repoType");
  const { RepoType: type } = repoType;

  if (type === "nextjs") {
    await Project.findOneAndUpdate(
      { appId: project.appId },
      { type: project.type, status: "running" },
    );
    return {
      success: false,
      message:
        "Nextjs projects are not supported yet, Rollbacked to previous version",
      liveUrl: `http://${project.appId}.127.0.0.1.nip.io:3000/`,
    };
  }

  let dockerResult;
  try {
    switch (type) {
      case "static":
        dockerResult = await deployStatic(
          config.NODE_ENV === "production"
            ? `/home/ubuntu/temp/app_${project.appId}`
            : `/home/ubuntu/temp/app_${project.appId}`,
          project.appId,
        );
        break;
      case "frontend":
        dockerResult = await deployFrontend(
          config.NODE_ENV === "production"
            ? `/home/ubuntu/temp/app_${project.appId}`
            : `/temp/app_${project.appId}`,
          project.appId,
        );
        break;
      case "backend":
        dockerResult = await deployBackend(
          config.NODE_ENV === "production"
            ? `/home/ubuntu/temp/app_${project.appId}`
            : `/temp/app_${project.appId}`,
          project.appId,
          env,
        );
        break;
      case "fullstack":
        dockerResult = await deployFullstack(
          config.NODE_ENV === "production"
            ? `/home/ubuntu/temp/app_${project.appId}`
            : `/temp/app_${project.appId}`,
          project.appId,
          env,
        );
        break;
      default:
        return { success: false, message: "Invalid repo type" };
    }

    const updateProject = await Project.findOneAndUpdate(
      { appId: project.appId, status: "redeploying" },
      {
        status: "running",
        containerID: dockerResult.containerId,
        port: dockerResult.port,
        type: repoType,
      },
    );
    const isDeleted = await deleteOldContainerAndImage(
      project.containerID,
      `app_${project.appId}`,
    );
    console.log(isDeleted, "isdeleted");
    if (!isDeleted) {
      return {
        success: false,
        message: "Failed to delete old container and image",
      };
    }
    return {
      success: true,
      repoUrl: project.repoUrl,
      appId: project.appId,
      containerId: dockerResult.containerId,
      liveUrl:
        config.NODE_ENV === "production"
          ? `https://${project.appId}.quicklive.tech/`
          : `http://${project.appId}.127.0.0.1.nip.io:3000/`,
    };
  } catch (err) {
    return {
      success: false,
      message:
        err.message +
        " Internal server error during redeployment rolled back to previous version",
      liveUrl: `https://${project.appId}.quicklive.tech/`,
    };
  }
}

export async function redeployFailedProject(project, env,userToken) {
  try {
    const path =
      config.NODE_ENV === "production"
        ? `/home/ubuntu/temp/app_${project.appId}`
        : `/temp/app_${project.appId}`;
    fs.appendFileSync(
      `logs/${project.appId}.log`,
      `[SYS] Cloning repository...\n`,
    );
    const result = await CloneRepo(path, project.repoUrl,userToken);

    if (!result.success) {
      fs.appendFileSync(
        `logs/${project.appId}.log`,
        `[ERROR] Clone failed: ${result.message}\n`,
      );
      await Project.findOneAndUpdate(
        { appId: project.appId },
        { status: "failed" },
      );
      return {
        success: false,
        message: result.message,
      };
    }
    fs.appendFileSync(
      `logs/${project.appId}.log`,
      `[SYS] Repository cloned successfully.\n`,
    );

    //detecting type of repo
    const repoType = await detectRepoType(path);
    const { RepoType: type } = repoType;

    fs.appendFileSync(
      `logs/${project.appId}.log`,
      `[SYS] Detected project type: ${type}\n`,
    );

    if (type === "nextjs") {
      await Project.findOneAndUpdate(
        { appId: project.appId },
        { status: "failed", type: repoType },
      );

      fs.appendFileSync(
        `logs/${project.appId}.log`,
        `[ERROR] Nextjs projects are not supported yet.\n`,
      );

      return {
        success: false,
        message: "Nextjs projects are not supported yet",
      };
    }
    console.log(type, "type of repo");
    fs.appendFileSync(
      `logs/${project.appId}.log`,
      `[SYS] Starting Docker build process...\n`,
    );
    let DockerResult;
    try {
      switch (type) {
        case "static":
          DockerResult = await deployStatic(path, project.appId);
          break;
        case "frontend":
          DockerResult = await deployFrontend(path, project.appId);
          break;
        case "backend":
          DockerResult = await deployBackend(path, project.appId, env);
          break;
        case "fullstack":
          DockerResult = await deployFullstack(path, project.appId, env);
          break;
        default:
          fs.appendFileSync(
            `logs/${project.appId}.log`,
            `[ERROR] Invalid repo type: ${type}\n`,
          );
          await Project.findOneAndUpdate(
            { appId: project.appId },
            { status: "failed" },
          );
          return {
            success: false,
            message: "Invalid repo type",
          };
      }
      console.log(DockerResult.containerId, "container id");
      console.log(DockerResult, "docker result");
      fs.appendFileSync(
        `logs/${project.appId}.log`,
        `[SYS] Docker deployment successful! Container ID: ${DockerResult.containerId.substring(0, 12)} on Port: ${DockerResult.port}\n`,
      );
      const updateProject = await Project.findOneAndUpdate(
        { appId: project.appId, status: "redeploying" },
        {
          status: "running",
          containerID: DockerResult.containerId,
          port: DockerResult.port,
          type: repoType,
        },
      );

      return {
        success: true,
        repoUrl: project.repoUrl,
        appId: project.appId,
        containerId: DockerResult.containerId,
        liveUrl: `https://${project.appId}.quicklive.tech/`,
      };
    } catch (err) {
      console.error("Deployment Error:", err);

      await Project.findOneAndUpdate(
        { appId: project.appId },
        { status: "failed", type: repoType },
      );
      return {
        success: false,
        message: err.message || "Internal server error during deployment",
      };
    }
  } catch (err) {
    console.error("Deployment Error:", err);
    return {
      success: false,
      message: err.message || "Internal server error during redeployment",
    };
  }
}
