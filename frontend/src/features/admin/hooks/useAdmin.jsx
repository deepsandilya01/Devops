import { useDispatch, useSelector } from "react-redux";
import {
  setLoading,
  setError,
  setUsers,
  setProjects,
  removeProject,
} from "../slices/admin.slice";
import {
  getAllUsers as getAllUsersApi,
  getAllAdminProjects as getAllAdminProjectsApi,
  deleteProjectApi,
} from "../services/admin.api";
 

const useAdmin = () => {
  const dispatch = useDispatch();
  const { loading, error, users, projects } = useSelector(
    (state) =>
      state.admin || { loading: false, error: null, users: [], projects: [] },
  );

  const getAllUsers = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const response = await getAllUsersApi();
      const fetchedUsers = response.users || [];
      dispatch(setUsers(fetchedUsers));
      return fetchedUsers;
    } catch (err) {
      dispatch(setError(err.message || "Failed to fetch users"));
      return [];
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getAllAdminProjects = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const response = await getAllAdminProjectsApi();
      const fetchedProjects = response.projects || [];
      dispatch(setProjects(fetchedProjects));
      return fetchedProjects;
    } catch (err) {
      dispatch(setError(err.message || "Failed to fetch admin projects"));
      return [];
    } finally {
      dispatch(setLoading(false));
    }
  };

  const deleteProjectById = async (projectId) => {
    try {
      dispatch(setError(null));
      await deleteProjectApi(projectId);
      dispatch(removeProject(projectId));
      return true;
    } catch (err) {
      dispatch(setError(err.message || "Failed to delete project"));
      return false;
    }
  };

  return {
    getAllUsers,
    getAllAdminProjects,
    deleteProjectById,
    users,
    projects,
    loading,
    error,
  };
};

export default useAdmin;
