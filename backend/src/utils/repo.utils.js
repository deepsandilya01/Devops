import fs from "fs";
import path from "path";

/**
 * Folder name to purpose mapping
 */
const FOLDER_PURPOSE_MAP = {
  src: "Source code",
  controllers: "Request handling logic",
  routes: "API routes definition",
  models: "Database models",
  middleware: "Express middleware",
  utils: "Utility functions",
  helpers: "Helper functions",
  services: "Business logic services",
  config: "Configuration files",
  public: "Static assets",
  static: "Static files",
  assets: "Asset files (images, fonts)",
  tests: "Test files",
  test: "Test files",
  spec: "Test specifications",
  docs: "Documentation",
  styles: "CSS/styling files",
  components: "React/UI components",
  features: "Feature modules",
  pages: "Page components",
  hooks: "React hooks",
  store: "State management",
  lib: "Library code",
  build: "Build output",
  dist: "Distribution build",
};

/**
 * Extracts tech stack from package.json
 * @param {string} repoPath - Path to the repository
 * @returns {Array<string>} Array of technologies
 */
export function extractTechStack(repoPath) {
  try {
    const packageJsonPath = path.join(repoPath, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      return [];
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const techStack = Object.keys(dependencies || {});

    return techStack;
  } catch (error) {
    console.error("Error extracting tech stack:", error.message);
    return [];
  }
}

/**
 * Finds entry points in the repository
 * @param {string} repoPath - Path to the repository
 * @returns {Array<string>} Array of entry point files
 */
export function findEntryPoints(repoPath) {
  const entryPointNames = ["index.js", "server.js", "app.js", "main.js"];
  const entryPoints = [];

  // Check root level
  for (const entry of entryPointNames) {
    const fullPath = path.join(repoPath, entry);
    if (fs.existsSync(fullPath)) {
      entryPoints.push(entry);
    }
  }

  // Check src folder
  const srcPath = path.join(repoPath, "src");
  if (fs.existsSync(srcPath)) {
    for (const entry of entryPointNames) {
      const fullPath = path.join(srcPath, entry);
      if (fs.existsSync(fullPath)) {
        entryPoints.push(`src/${entry}`);
      }
    }
  }

  return entryPoints;
}

/**
 * Analyzes top-level folders and assigns purposes
 * @param {string} repoPath - Path to the repository
 * @returns {Array<{path: string, purpose: string}>} Array of folder analysis
 */
export function analyzeFolders(repoPath) {
  const foldersToIgnore = [
    "node_modules",
    ".git",
    ".github",
    ".vscode",
    ".idea",
    "dist",
    "build",
    ".next",
    "coverage",
    ".env",
    ".env.local",
  ];

  const folderExplanations = [];

  try {
    const items = fs.readdirSync(repoPath);

    for (const item of items) {
      const fullPath = path.join(repoPath, item);

      // Skip non-directories and ignored folders
      if (
        !fs.statSync(fullPath).isDirectory() ||
        foldersToIgnore.includes(item)
      ) {
        continue;
      }

      const purpose =
        FOLDER_PURPOSE_MAP[item.toLowerCase()] || `${item} directory`;

      folderExplanations.push({
        path: item,
        purpose,
      });
    }
  } catch (error) {
    console.error("Error analyzing folders:", error.message);
  }

  return folderExplanations;
}

/**
 * Generates a project summary based on extracted data
 * @param {string} repoName - Name of the repository
 * @param {Array<string>} techStack - Tech stack technologies
 * @param {Array<string>} entryPoints - Entry points found
 * @returns {string} Project summary
 */
export function generateProjectSummary(repoName, techStack, entryPoints) {
  try {
    // Detect project type
    let projectType = "Unknown";
    const dependencies = techStack.map((d) => d.toLowerCase());

    if (
      dependencies.includes("react") ||
      dependencies.includes("vue") ||
      dependencies.includes("angular")
    ) {
      projectType = "Frontend";
    } else if (
      dependencies.includes("express") ||
      dependencies.includes("fastify") ||
      dependencies.includes("hapi")
    ) {
      projectType = "Backend";
    } else if (
      dependencies.includes("react") &&
      dependencies.includes("express")
    ) {
      projectType = "Fullstack";
    } else if (dependencies.includes("next")) {
      projectType = "Next.js Fullstack";
    }

    // Count key dependencies
    const hasTypeScript = dependencies.includes("typescript");
    const hasTesting = dependencies.some((d) =>
      ["jest", "mocha", "vitest", "cypress"].includes(d),
    );
    const hasDB = dependencies.some((d) =>
      ["mongoose", "sequelize", "prisma", "typeorm"].includes(d),
    );

    let summary = `${projectType} project named ${repoName}`;

    const features = [];
    if (hasTypeScript) features.push("TypeScript");
    if (hasTesting) features.push("testing");
    if (hasDB) features.push("database integration");

    if (features.length > 0) {
      summary += ` with ${features.join(", ")}`;
    }

    summary += `.`;

    return summary;
  } catch (error) {
    console.error("Error generating summary:", error.message);
    return `Project ${repoName}`;
  }
}

/**
 * Extracts repository name from URL
 * @param {string} repoUrl - GitHub repository URL
 * @returns {string} Repository name
 */
export function extractRepoName(repoUrl) {
  try {
    // Handle both HTTPS and SSH URLs
    // HTTPS: https://github.com/user/repo.git or https://github.com/user/repo
    // SSH: git@github.com:user/repo.git

    let name = repoUrl.replace(/\.git$/, ""); // Remove .git suffix
    name = name.split("/").pop(); // Get last part after /

    return name || "unknown";
  } catch (error) {
    console.error("Error extracting repo name:", error.message);
    return "unknown";
  }
}
