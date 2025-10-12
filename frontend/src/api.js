import axios from 'axios';

// Use the dev-server proxy (setupProxy.js) by using a relative base URL '/api'.
// This avoids CORS issues when the frontend runs on a different port (e.g. 3002).
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
}, (error) => Promise.reject(error));

export default api;
