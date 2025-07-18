import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('/api/auth/user', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(res => {
        setCurrentUser(res.data);
      })
      .catch(err => {
        console.error('Ошибка загрузки пользователя:', err);
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password }, { withCredentials: true });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error('Ошибка входа:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
    } catch (e) {}
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const updateUser = (userData) => {
    setCurrentUser(userData);
  };

  // Вычисляем, верифицирован ли пользователь (есть ли armaId)
  const verified = currentUser?.armaId ? true : false;

  const value = {
    currentUser,
    login,
    logout,
    updateUser,
    loading,
    verified
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}