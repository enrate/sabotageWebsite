import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('adminToken') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token && !user) {
      setLoading(true);
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.role === 'admin') {
            setUser(data);
          } else {
            logout();
          }
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Ошибка авторизации');
      if (data.user.role !== 'admin') throw new Error('Нет доступа: только для админов');
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('adminToken', data.token);
    } catch (e) {
      setError(e.message);
      setUser(null);
      setToken(null);
      localStorage.removeItem('adminToken');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('adminToken');
  };

  return (
    <AdminAuthContext.Provider value={{ user, token, loading, error, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};