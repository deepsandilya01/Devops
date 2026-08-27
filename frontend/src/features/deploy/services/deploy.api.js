import axios from "axios";

const deployApi = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export async function getAllRepo() {
  try {
    const response = await deployApi.get("/github/all-repo");
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Server Error");
  }
}

export async function deployProject(repoUrl, env) {
  try {
    const response = await deployApi.post("/project/deploy", { repoUrl, env });
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Server Error");
  }
}

export async function getProjectLogs(appId) {
  try {
    const response = await deployApi.get(`/project/logs/${appId}`);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Server Error");
  }
}

export async function getUserProjects() {
  try {
    const response = await deployApi.get("/project/all");
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Server Error");
  }
}

export async function analyzeRepository(repoUrl) {
  try {
    const response = await deployApi.post("/project/analyze", { repoUrl });
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Server Error");
  }
}

export async function getProjectSummary(id) {
  try {
    const response = await deployApi.get(`/project/summary/${id}`);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Server Error");
  }
}

export async function deleteProject(appId) {
  try {
    const response = await deployApi.delete("/project/delete", {
      data: { appId },
    });
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Server Error");
  }
}

export async function redeployProject(appId, env) {
  try {
    const response = await deployApi.post("/project/redeploy", { appId, env });
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Server Error");
  }
}

// Generate Website APIs
export async function getTemplates() {
  try {
    const response = await deployApi.get("/generate/templates");
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Server Error");
  }
}

export async function generateWebsite(data) {
    try {
        const response = await deployApi.post('/generate/website', data);
        return response.data;
    } catch(err) {
        if (!err.response) {
            throw new Error("Network Error: The AI generation took too long or the server disconnected. Please try a shorter prompt or try again.");
        }
        throw new Error(err.response?.data?.message || "Server Error");
    }
}

export async function chatAssistant(data) {
  try {
    const response = await deployApi.post("/generate/chat", data);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Server Error");
  }
}

export async function getProjectByAppId(appId) {
  try {
    const response = await deployApi.get(`/project/${appId}`);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Server Error");
  }
}

export async function getContainerStats(appId) {
  try {
    const response = await deployApi.get(`/project/${appId}/stats`);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Server Error");
  }
}

// Admin APIs moved to admin.api.js
