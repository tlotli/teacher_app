import apiClient from "./config.js";

export const authApi = {
  login(email, password) {
    return apiClient.post("/teacher/login", { email, password });
  },
  logout() {
    return apiClient.post("/teacher/logout");
  },
  getProfile() {
    return apiClient.get("/teacher/profile");
  },
};
