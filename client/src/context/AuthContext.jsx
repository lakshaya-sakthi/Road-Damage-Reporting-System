import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('rg_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('rg_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('rg_token');
          localStorage.removeItem('rg_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('rg_token', receivedToken);
      localStorage.setItem('rg_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('rg_token');
    localStorage.removeItem('rg_user');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/me', profileData);
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('rg_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const role = user?.role || '';
  const isAdmin = role === 'admin';
  const isSupervisor = role === 'supervisor';
  const isInspector = role === 'field_inspector';
  const isWorker = role === 'worker';
  const isAuditor = role === 'auditor';

  const canUpload = ['admin', 'supervisor', 'field_inspector'].includes(role);
  const canVerify = ['admin', 'supervisor'].includes(role);
  const canAssign = ['admin', 'supervisor'].includes(role);
  const canManageUsers = isAdmin;

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateProfile,
    role,
    isAdmin,
    isSupervisor,
    isInspector,
    isWorker,
    isAuditor,
    canUpload,
    canVerify,
    canAssign,
    canManageUsers
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
