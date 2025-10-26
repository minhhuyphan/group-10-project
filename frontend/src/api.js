import axios from 'axios';

// Determine backend base URL from environment (for production) or use proxy in dev
const BACKEND_BASE = process.env.REACT_APP_API_URL || '';

// Single API instance
const api = axios.create({
  // If BACKEND_BASE is set (production), we'll use absolute base and rewrite paths below
  baseURL: BACKEND_BASE || '/api',
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
    // In production (absolute baseURL), rewrite special endpoints that
    // are not under '/api' on the backend (auth and profile)
    try {
      if (BACKEND_BASE) {
        if (typeof config.url === 'string') {
          if (config.url.startsWith('/api/auth/')) {
            config.url = config.url.replace('/api', ''); // -> /auth/...
          } else if (config.url === '/api/profile' || config.url.startsWith('/api/profile')) {
            config.url = config.url.replace('/api', ''); // -> /profile
          }
        }
      }
    } catch (_) {
      // noop
    }

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
          // Use the same api instance so URL rewriting and baseURL apply
          refreshPromise = api.post('/api/auth/refresh', { refreshToken });
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
