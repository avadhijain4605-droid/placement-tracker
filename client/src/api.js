const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }
  if (!res.ok) {
    const message = (data && (data.error || data.message)) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function buildQuery(params) {
  const parts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

export const api = {
  signup: (name, email, password) =>
    request("/auth/signup", { method: "POST", body: { name, email, password } }),
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),

  listCompanies: (params = {}) =>
    request(`/companies${buildQuery(params)}`),
  getCompany: (id) => request(`/companies/${id}`),
  listIndustries: () => request("/companies/industries"),
  enrichCompany: (companyName) =>
    request("/companies/enrich", { method: "POST", body: { companyName } }),
  createCompany: (data) =>
    request("/companies", { method: "POST", body: data }),

  listExperiences: (params = {}) =>
    request(`/experiences${buildQuery(params)}`),
  getExperience: (id) => request(`/experiences/${id}`),
  submitExperience: (data) =>
    request("/experiences", { method: "POST", body: data }),

  getStudent: (id) => request(`/students/${id}`),
  updateProfile: (data) => request("/students/me", { method: "PUT", body: data }),
  generatePlan: (companyId, availableDays) =>
    request("/ai/preparation-plan", { method: "POST", body: { companyId, availableDays } }),
  skillGap: (companyId) =>
    request("/ai/skill-gap", { method: "POST", body: { companyId } }),
  listProgress: () => request("/ai/progress"),
  toggleTask: (progressId, taskId) =>
    request(`/ai/progress/${progressId}/toggle`, { method: "PUT", body: { taskId } }),

  // ── Placement Cell module ──────────────────────────────────────────

  // Companies (admin)
  updateCompany: (id, data) => request(`/companies/${id}`, { method: "PUT", body: data }),
  archiveCompany: (id) => request(`/companies/${id}/archive`, { method: "PUT" }),

  // Drives
  listDrives: (params = {}) => request(`/drives${buildQuery(params)}`),
  getDrive: (id) => request(`/drives/${id}`),
  createDrive: (data) => request("/drives", { method: "POST", body: data }),
  updateDrive: (id, data) => request(`/drives/${id}`, { method: "PUT", body: data }),
  updateDriveStatus: (id, status) => request(`/drives/${id}/status`, { method: "PUT", body: { status } }),
  deleteDrive: (id) => request(`/drives/${id}`, { method: "DELETE" }),

  // Applications
  listApplications: (params = {}) => request(`/applications${buildQuery(params)}`),
  getApplication: (id) => request(`/applications/${id}`),
  applyToDrive: (driveId, coverNote) => request("/applications", { method: "POST", body: { driveId, coverNote } }),
  updateApplicationStatus: (id, status, note) => request(`/applications/${id}/status`, { method: "PUT", body: { status, note } }),
  withdrawApplication: (id) => request(`/applications/${id}/withdraw`, { method: "PUT" }),

  // Announcements
  listAnnouncements: (params = {}) => request(`/announcements${buildQuery(params)}`),
  getAnnouncement: (id) => request(`/announcements/${id}`),
  createAnnouncement: (data) => request("/announcements", { method: "POST", body: data }),
  updateAnnouncement: (id, data) => request(`/announcements/${id}`, { method: "PUT", body: data }),
  deleteAnnouncement: (id) => request(`/announcements/${id}`, { method: "DELETE" }),

  // Notifications
  listNotifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PUT" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "PUT" }),

  // Experiences (moderation)
  moderateExperience: (id, status, rejectionReason) =>
    request(`/experiences/${id}/moderate`, { method: "PUT", body: { status, rejectionReason } }),

  // Companies (admin) — delete
  deleteCompany: (id) => request(`/companies/${id}`, { method: "DELETE" }),

  // Admin
  adminDashboard: () => request("/admin/dashboard"),
  adminUsers: () => request("/admin/users"),
  adminChangeRole: (id, role) => request(`/admin/users/${id}/role`, { method: "PUT", body: { role } }),
  adminArchiveUser: (id) => request(`/admin/users/${id}/archive`, { method: "PUT" }),
  adminAuditLogs: (params = {}) => request(`/admin/audit${buildQuery(params)}`),
  adminStudents: (params = {}) => request(`/admin/students${buildQuery(params)}`),
  adminStudentDetail: (id) => request(`/admin/students/${id}`),
  adminSuspendStudent: (id) => request(`/admin/students/${id}/suspend`, { method: "PUT" }),
  adminReactivateStudent: (id) => request(`/admin/students/${id}/reactivate`, { method: "PUT" }),
  adminExperiences: (params = {}) => request(`/admin/experiences${buildQuery(params)}`),
  adminAnalytics: () => request("/admin/analytics"),
};
