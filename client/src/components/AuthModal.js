import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './CreateSquadModal.css';

const AuthModal = ({ onClose }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  // TODO: реализовать регистрацию через API
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Пример запроса, замените на свой endpoint
      // await register(username, email, password);
      setMode('login');
      setError('Регистрация успешна! Теперь войдите.');
    } catch (err) {
      setError('Ошибка регистрации');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setError('Неверные учетные данные');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{mode === 'login' ? 'Авторизация' : 'Регистрация'}</h2>
        {error && <div className="error-message">{error}</div>}
        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="modal-actions">
              <button type="button" onClick={onClose}>Отмена</button>
              <button type="submit">Войти</button>
            </div>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              Нет аккаунта?{' '}
              <button type="button" style={{ background: 'none', color: '#ffb347', border: 'none', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setMode('register'); setError(''); }}>Зарегистрироваться</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Имя пользователя</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="modal-actions">
              <button type="button" onClick={onClose}>Отмена</button>
              <button type="submit">Зарегистрироваться</button>
            </div>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              Уже есть аккаунт?{' '}
              <button type="button" style={{ background: 'none', color: '#ffb347', border: 'none', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setMode('login'); setError(''); }}>Войти</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal; 