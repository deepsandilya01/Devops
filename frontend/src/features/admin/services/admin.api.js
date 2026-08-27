import axios from "axios";

const adminApi = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getAllUsers() {
  try {
    const response = await adminApi.get("/admin/users");
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Server Error");
  }
}

export async function getAllAdminProjects() {
  try {
    const response = await adminApi.get("/admin/projects");
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Server Error");
  }
}

export async function deleteProjectApi(projectId) {
  try {
    const response = await adminApi.delete(`/admin/project/${projectId}`);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Server Error");
  }
}
