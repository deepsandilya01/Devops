import axios from "axios";

const authApi = axios.create({
  baseURL: "/api/auth",
  withCredentials: true,
});

export async function login({ email, password }) {
  const response = await authApi.post("/login", {
    email,
    password,
  });
  return response.data;
}

export async function register({ fullName, contact, email, password }) {
  const response = await authApi.post("/register", {
    fullName,
    email,
    contact,
    password,
  });
  return response.data;
}

export async function Me() {
  const response = await authApi.get("/get-me");
  return response.data;
}

export async function logout() {
  const response = await authApi.post("/logout");
  return response.data;
}

export async function updateProfile(data) {
  const response = await authApi.put("/update-profile", data);
  return response.data;
}
