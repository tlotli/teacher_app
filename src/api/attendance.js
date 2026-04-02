import apiClient from "./config.js";

export const attendanceApi = {
  getClasses() {
    return apiClient.get("/teacher/classes");
  },
  getStudents(classId) {
    return apiClient.get(`/teacher/classes/${classId}/students`);
  },
  getAttendance(classId, date) {
    return apiClient.get(`/teacher/attendance/${classId}/${date}`);
  },
  bulkMark(payload) {
    return apiClient.post("/teacher/attendance/bulk", payload);
  },
  getTimetableToday() {
    return apiClient.get("/teacher/timetable/today");
  },
  getSubjects() {
    return apiClient.get("/teacher/subjects");
  },
  checkIn(data = {}) {
    return apiClient.post("/teacher/check-in", data);
  },
};
