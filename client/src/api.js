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

  listExperiences: (params = {}) =>
    request(`/experiences${buildQuery(params)}`),
  getExperience: (id) => request(`/experiences/${id}`),
  submitExperience: (data) =>
    request("/experiences", { method: "POST", body: data }),

  getStudent: (id) => request(`/students/${id}`),
  updateProfile: (data) => request("/students/me", { method: "PUT", body: data }),
  generatePlan: (companyId, availableDays) =>
    request("/ai/preparation-plan", { method: "POST", body: { companyId, availableDays } }),
};
