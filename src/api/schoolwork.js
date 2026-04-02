import apiClient from "./config.js";

export const schoolworkApi = {
  getAll(params = {}) {
    return apiClient.get("/teacher/schoolwork", { params });
  },
  create(data) {
    return apiClient.post("/teacher/schoolwork", data);
  },
  update(id, data) {
    return apiClient.put(`/teacher/schoolwork/${id}`, data);
  },
  remove(id) {
    return apiClient.delete(`/teacher/schoolwork/${id}`);
  },
  getSubmissions(id) {
    return apiClient.get(`/teacher/schoolwork/${id}/submissions`);
  },
  gradeSubmission(submissionId, data) {
    return apiClient.put(`/teacher/schoolwork/submissions/${submissionId}`, data);
  },
};
