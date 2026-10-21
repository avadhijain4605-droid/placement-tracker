const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("pt_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("pt_token", token);
  else localStorage.removeItem("pt_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
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

export const api = {
  signup: (name, email, password) => request("/auth/signup", { method: "POST", body: { name, email, password }, auth: false }),
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  listCompanies: (active) => request(`/companies${active !== undefined ? `?active=${active}` : ""}`),
  getStudent: (id) => request(`/students/${id}`),
  updateProfile: (data) => request("/students/me", { method: "PUT", body: data }),
  generatePlan: (companyId, availableDays) =>
    request("/ai/preparation-plan", { method: "POST", body: { companyId, availableDays } }),
};

export { getToken };
