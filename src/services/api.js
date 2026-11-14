
const API_BASE_URL = "https://tread-d84x.onrender.com";

export const API = API_BASE_URL;

export function getToken() {
  return localStorage.getItem("TOKEN") || "";
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("TOKEN", token);
  } else {
    localStorage.removeItem("TOKEN");
  }
}

export function clearToken() {
  localStorage.removeItem("TOKEN");
}

let unauthorizedHandler = null;

export function setOn401(callback) {
  unauthorizedHandler =
    typeof callback === "function" ? callback : null;
}

async function api(path, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    ...rest
  } = options;

  const token = getToken();

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && body !== null && !isFormData) {
    requestHeaders["Content-Type"] =
      requestHeaders["Content-Type"] || "application/json";
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const config = {
    method: method.toUpperCase(),
    headers: requestHeaders,
    ...rest,
  };

  if (body !== undefined && body !== null) {
    config.body = isFormData
      ? body
      : typeof body === "string"
        ? body
        : JSON.stringify(body);
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
      config
    );
  } catch (error) {
    throw new Error(
      "সার্ভারের সঙ্গে সংযোগ করা যাচ্ছে না। Internet অথবা Backend Server পরীক্ষা করুন।"
    );
  }

  let data = null;
  const contentType = response.headers.get("content-type") || "";

  if (response.status !== 204) {
    try {
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { detail: text } : null;
      }
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();

      if (unauthorizedHandler) {
        unauthorizedHandler();
      }
    }

    const detail =
      data?.detail ||
      data?.message ||
      data?.error ||
      `Request failed (${response.status})`;

    const error = new Error(
      Array.isArray(detail)
        ? detail.map((item) => item.msg || JSON.stringify(item)).join(", ")
        : typeof detail === "string"
          ? detail
          : JSON.stringify(detail)
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

export default api;

export { api };

// Convenience methods
export const apiGet = (path, options = {}) =>
  api(path, { ...options, method: "GET" });

export const apiPost = (path, body, options = {}) =>
  api(path, { ...options, method: "POST", body });

export const apiPut = (path, body, options = {}) =>
  api(path, { ...options, method: "PUT", body });

export const apiPatch = (path, body, options = {}) =>
  api(path, { ...options, method: "PATCH", body });

export const apiDelete = (path, options = {}) =>
  api(path, { ...options, method: "DELETE" });
