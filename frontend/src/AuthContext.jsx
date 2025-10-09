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

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
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
      const res = await api.post('/signup', { name, email, password });
      // if backend returns user data or token, handle accordingly
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await api.post('/login', { email, password });
      // Expecting { token, user } from backend
      const { token: receivedToken, user: receivedUser } = res.data;
      if (receivedToken) {
        setToken(receivedToken);
      }
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
    <AuthContext.Provider value={{ token, user, loading, signup, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
