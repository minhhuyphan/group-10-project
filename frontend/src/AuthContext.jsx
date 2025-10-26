import React, { createContext, useState, useEffect } from 'react';
import api, { getAccessToken as apiGetAccessToken, setAccessToken as apiSetAccessToken, getRefreshToken as apiGetRefreshToken, setRefreshToken as apiSetRefreshToken, clearTokens as apiClearTokens } from './api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(() => apiGetAccessToken() || null);
  const [refreshToken, setRefreshToken] = useState(() => apiGetRefreshToken() || null);
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(() => {
    // If there's a token in localStorage we should consider the context initializing
    return !!apiGetAccessToken();
  });

  useEffect(() => {
    if (accessToken) {
      apiSetAccessToken(accessToken);
    } else {
      // clear only access token; keep refresh if any until explicit logout
      localStorage.removeItem('accessToken');
    }
  }, [accessToken]);

  useEffect(() => {
    if (refreshToken) {
      apiSetRefreshToken(refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }, [refreshToken]);

  // When token becomes available, refresh user profile from server
  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      if (!accessToken) {
        setInitializing(false);
        return;
      }
      setInitializing(true);
      try {
        const res = await api.get('/profile');
        if (mounted && res.data && res.data.user) {
          setUser(res.data.user);
        }
      } catch (e) {
        // If token invalid or other error, clear stored auth
        console.warn('Failed to refresh profile:', e.message || e);
      }
      finally {
        setInitializing(false);
      }
    };
    fetchProfile();
    return () => { mounted = false; };
  }, [accessToken]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const signup = async ({ name, email, password }) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', { name, email, password });
      // Do NOT auto-set token/user here — redirect user to login instead
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      // Support both legacy { token, user } and new { accessToken, refreshToken, user }
      const { accessToken: at, refreshToken: rt, token: legacyToken, user: receivedUser } = res.data || {};
      const finalAT = at || legacyToken || null;
      if (finalAT) setAccessToken(finalAT);
      if (rt) setRefreshToken(rt);
      if (receivedUser) setUser(receivedUser);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const rt = apiGetRefreshToken();
      // Best-effort revoke; ignore errors if backend not implemented
      await api.post('/auth/logout', { refreshToken: rt });
    } catch (_) {}
    setAccessToken(null);
    setRefreshToken(null);
    apiClearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ accessToken, refreshToken, user, loading, initializing, signup, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
