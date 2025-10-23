import axios from 'axios';

// Base API instance using CRA proxy via '/api'
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ---- Token storage helpers (backward compatible) ----
export const getAccessToken = () =>
  localStorage.getItem('accessToken') || localStorage.getItem('token');

export const getRefreshToken = () => localStorage.getItem('refreshToken');

export const setAccessToken = (accessToken) => {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
};

export const setRefreshToken = (refreshToken) => {
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // legacy
  localStorage.removeItem('token');
};

// ---- Attach Authorization header on every request ----
api.interceptors.request.use(
  (config) => {
    try {
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

// ---- Auto refresh on 401 and retry original request ----
let isRefreshing = false;
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config || {};

    // Avoid infinite loop
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        return Promise.reject(error);
      }

      try {
        // Single-flight refresh
        if (!isRefreshing) {
          isRefreshing = true;
          // Use a fresh axios call to bypass this instance interceptors
          refreshPromise = axios.post('/api/auth/refresh', { refreshToken });
        }

        const res = await refreshPromise;
        const { accessToken, refreshToken: newRefresh, token: legacyAccess } = res.data || {};
        const nextAccessToken = accessToken || legacyAccess;

        if (nextAccessToken) setAccessToken(nextAccessToken);
        if (newRefresh) setRefreshToken(newRefresh);

        // Update header and retry
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
