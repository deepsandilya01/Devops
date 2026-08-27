import { useDispatch, useSelector } from "react-redux";
import { setLoading, setError } from "../slices/deploy.slice";
import { 
  getAllRepo, 
  deployProject as deployProjectApi, 
  getProjectLogs as getProjectLogsApi, 
  getUserProjects,
  analyzeRepository,
  getProjectSummary as getProjectSummaryApi,
  deleteProject as deleteProjectApi,
  redeployProject as redeployProjectApi,
  getTemplates as getTemplatesApi,
  generateWebsite as generateWebsiteApi,
  chatAssistant as chatAssistantApi,
  getProjectByAppId as getProjectByAppIdApi,
  getContainerStats as getContainerStatsApi
} from "../services/deploy.api";

const useDeploy = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.deploy || { loading: false, error: null });

  const fetchRepos = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const responseBody = await getAllRepo();
      const repos = responseBody?.repos ?? responseBody?.data ?? responseBody;
      return Array.isArray(repos) ? repos : null;
    } catch (err) {
      dispatch(setError(err.message || "Failed to fetch repositories"));
      return null;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const deployRepo = async (repoUrl, env) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const response = await deployProjectApi(repoUrl, env);
      return response;
    } catch (err) {
      dispatch(setError(err.message || "Failed to deploy project"));
      return { success: false, message: err.message || "Deployment failed" };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const fetchLogs = async (appId) => {
    try {
      const response = await getProjectLogsApi(appId);
      return response;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const fetchProjects = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const response = await getUserProjects();
      return response.projects || [];
    } catch (err) {
      dispatch(setError(err.message || "Failed to fetch projects"));
      return [];
    } finally {
      dispatch(setLoading(false));
    }
  };

  const fetchProject = async (appId) => {
    try {
      const response = await getProjectByAppIdApi(appId);
      return response;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const fetchContainerStats = async (appId) => {
    try {
      const response = await getContainerStatsApi(appId);
      return response;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const analyzeRepo = async (repoUrl) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const response = await analyzeRepository(repoUrl);
      return response;
    } catch (err) {
      dispatch(setError(err.message || "Failed to analyze repository"));
      return { success: false, message: err.message };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getProjectSummary = async (id) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const response = await getProjectSummaryApi(id);
      return response;
    } catch (err) {
      dispatch(setError(err.message || "Failed to fetch project summary"));
      return { success: false, message: err.message };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const deleteProject = async (appId) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const response = await deleteProjectApi(appId);
      return response;
    } catch (err) {
      dispatch(setError(err.message || "Failed to delete project"));
      return { success: false, message: err.message };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const redeployProject = async (appId, env) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const response = await redeployProjectApi(appId, env);
      return response;
    } catch (err) {
      dispatch(setError(err.message || "Failed to redeploy project"));
      return { success: false, message: err.message };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Generate Endpoints
  const getTemplates = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const response = await getTemplatesApi();
      return response;
    } catch (err) {
      dispatch(setError(err.message || "Failed to fetch templates"));
      return { success: false, message: err.message };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const generateWebsite = async (data) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const response = await generateWebsiteApi(data);
      return response;
    } catch (err) {
      dispatch(setError(err.message || "Failed to generate website"));
      return { success: false, message: err.message };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const chatAssistant = async (data) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const response = await chatAssistantApi(data);
      return response;
    } catch (err) {
      dispatch(setError(err.message || "Chat failed"));
      return { success: false, message: err.message };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Admin endpoints moved to useAdmin.jsx

  return {
    fetchRepos,
    deployRepo,
    fetchLogs,
    fetchProjects,
    fetchProject,
    fetchContainerStats,
    analyzeRepo,
    getProjectSummary,
    deleteProject,
    redeployProject,
    getTemplates,
    generateWebsite,
    chatAssistant,
    loading,
    error
  };
};

export default useDeploy;
