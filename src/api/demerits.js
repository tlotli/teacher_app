import apiClient from "./config.js";

export const demeritApi = {
  getCategories() {
    return apiClient.get("/teacher/demerits/categories");
  },
  getDemerits(page = 1) {
    return apiClient.get("/teacher/demerits", { params: { page } });
  },
  searchStudents(q) {
    return apiClient.get("/teacher/demerits/students", { params: { q } });
  },
  issue(data) {
    return apiClient.post("/teacher/demerits", data);
  },
  remove(id) {
    return apiClient.delete(`/teacher/demerits/${id}`);
  },
};
