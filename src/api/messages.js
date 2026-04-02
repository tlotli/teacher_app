import apiClient from "./config.js";

export const messagesApi = {
  getThreads(page = 1) {
    return apiClient.get("/teacher/messages", { params: { page } });
  },
  getThread(threadId) {
    return apiClient.get(`/teacher/messages/${threadId}`);
  },
  sendMessage(data) {
    return apiClient.post("/teacher/messages", data);
  },
  reply(threadId, body) {
    return apiClient.post(`/teacher/messages/${threadId}/reply`, { body });
  },
  getUnreadCount() {
    return apiClient.get("/teacher/messages/unread-count");
  },
};
