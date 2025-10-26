import axios from "axios";

// ---- Base URL detection ----
// Nếu chạy local: dùng proxy CRA (/api)
// Nếu chạy production (Render, Vercel...): dùng biến môi trường
const BACKEND_BASE = process.env.REACT_APP_API_URL || "";

// Tạo instance axios
const api = axios.create({
  baseURL: BACKEND_BASE || "/api",
  headers: { "Content-Type": "application/json" },
});

// ---- Token helpers ----
export const getAccessToken = () =>
  localStorage.getItem("accessToken") || localStorage.getItem("token");

export const getRefreshToken = () => localStorage.getItem("refreshToken");

export const setAccessToken = (token) => {
  if (token) localStorage.setItem("accessToken", token);
};

export const setRefreshToken = (token) => {
  if (token) localStorage.setItem("refreshToken", token);
};

export const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("token"); // legacy
};

// ---- Request interceptor: gắn token + chỉnh URL production ----
api.interceptors.request.use(
  (config) => {
    try {
      // Nếu đang ở production và gọi các endpoint đặc biệt
      if (BACKEND_BASE && typeof config.url === "string") {
        if (config.url.startsWith("/api/auth/")) {
          config.url = config.url.replace("/api", ""); // => /auth/...
        } else if (
          config.url === "/api/profile" ||
          config.url.startsWith("/api/profile")
        ) {
          config.url = config.url.replace("/api", ""); // => /profile
        }
      }

      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_) {
      // noop
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response interceptor: refresh token khi 401 ----
let isRefreshing = false;
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config || {};

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        return Promise.reject(error);
      }

      try {
        // Chỉ 1 request refresh được thực hiện cùng lúc
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = api.post("/api/auth/refresh", { refreshToken });
        }

        const res = await refreshPromise;
        const {
          accessToken,
          refreshToken: newRefresh,
          token: legacyAccess,
        } = res.data || {};
        const nextAccessToken = accessToken || legacyAccess;

        if (nextAccessToken) setAccessToken(nextAccessToken);
        if (newRefresh) setRefreshToken(newRefresh);

        // Gắn lại token mới và retry request cũ
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        clearTokens();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
