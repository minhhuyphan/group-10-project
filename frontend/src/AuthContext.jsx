import React, { createContext, useState, useEffect } from 'react';
import api from './api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
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
    return !!localStorage.getItem('token');
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // When token becomes available, refresh user profile from server
  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      if (!token) {
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
  }, [token]);

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
      // Expecting { token, user } from backend
      const { token: receivedToken, user: receivedUser } = res.data;
      if (receivedToken) setToken(receivedToken);
      if (receivedUser) setUser(receivedUser);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, initializing, signup, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
