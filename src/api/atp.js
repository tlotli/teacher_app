import apiClient from "./config.js";

export const atpApi = {
  getPlans() {
    return apiClient.get("/teacher/atp/plans");
  },
  getPlan(planId) {
    return apiClient.get(`/teacher/atp/plans/${planId}`);
  },
  recordProgress(planId, progress) {
    return apiClient.post(`/teacher/atp/plans/${planId}/progress`, { progress });
  },
  getSummary() {
    return apiClient.get("/teacher/atp/summary");
  },
};
