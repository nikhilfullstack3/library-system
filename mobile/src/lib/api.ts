import Constants from "expo-constants";

const configuredApiUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  "http://192.168.1.21:5001/api";

const API_BASE = configuredApiUrl.replace(/\/$/, "");
const API_ORIGIN = API_BASE.replace(/\/api$/, "");
let authToken = "";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: any;
};

export function setAuthToken(token = "") {
  authToken = token;
}

export async function apiRequest(path: string, options: ApiRequestOptions = {}) {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const body =
    options.body && !isFormData && typeof options.body === "object"
      ? JSON.stringify(options.body)
      : (options.body as BodyInit | undefined);

  const response = await fetch(`${API_BASE}${path}`, {
    ...(options as RequestInit),
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
      ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
    },
    body,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export { API_BASE, API_ORIGIN };
