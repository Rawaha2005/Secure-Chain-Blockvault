import axios from "axios";

const getBaseUrl = () => {
  if (import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return localStorage.getItem("soc_api_url") || "http://127.0.0.1:8000";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token and update baseURL dynamically
api.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl();
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor to handle unauthenticated 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if we are already on login page or attempting login
      const isLoginRequest = error.config?.url?.includes("/auth/login");
      if (!isLoginRequest && !window.location.pathname.startsWith("/login") && window.location.pathname !== "/") {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

// Helper to download evidence files as decrypted blobs
export const downloadEvidenceFile = async (fileId, filename) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${getBaseUrl()}/files/download/${fileId}`, {
    responseType: "blob",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename || `evidence-${fileId}.bin`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default api;