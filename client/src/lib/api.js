const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const API_ORIGIN = API_BASE.replace(/\/api$/, "");
let authToken = "";

export function setAuthToken(token = "") {
  authToken = token;
}

export async function apiRequest(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
    },
    body: options.body ? (isFormData ? options.body : JSON.stringify(options.body)) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export { API_BASE, API_ORIGIN };
