import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './CreateSquadModal.css';
import { register } from '../services/register';

const AuthModal = ({ onClose, onShowSnackbar }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      const result = await register({ username, email, password });
      setError('');
      // Закрываем модалку и показываем попап
      if (onShowSnackbar) {
        onShowSnackbar('Регистрация успешна! Проверьте ваш email для подтверждения аккаунта.');
      }
      onClose();
      setMode('login');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setUsername('');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Ошибка регистрации');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      if (err.response && err.response.data) {
        if (err.response.data.emailNotVerified) {
          setError('Email не подтвержден. Проверьте вашу почту и перейдите по ссылке для подтверждения.');
        } else {
          setError(err.response.data.message);
        }
      } else {
        setError('Неверные учетные данные');
      }
    } finally {
      setLoading(false);
    }
  };

  // Закрытие по клику вне модалки
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(30,30,30,0.75)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s',
      }}
      onClick={handleOverlayClick}
    >
      <div
        className="modal"
        style={{
          background: 'rgba(35, 37, 38, 0.8)',
          borderRadius: 16,
          boxShadow: '0 6px 24px 0 rgba(255,179,71,0.16), 0 2px 10px rgba(0,0,0,0.14)',
          border: '2px solid #ffb347',
          padding: '32px 24px 24px 24px',
          minWidth: 320,
          maxWidth: '90vw',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          animation: 'slideDown 0.3s',
        }}
        onClick={e => e.stopPropagation()}
      >
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
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="modal-actions">
              <button type="button" onClick={onClose} disabled={loading}>Отмена</button>
              <button type="submit" disabled={loading}>{loading ? 'Вход...' : 'Войти'}</button>
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
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Повторите пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="modal-actions">
              <button type="button" onClick={onClose} disabled={loading}>Отмена</button>
              <button type="submit" disabled={loading}>{loading ? 'Регистрация...' : 'Зарегистрироваться'}</button>
            </div>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              Уже есть аккаунт?{' '}
              <button type="button" style={{ background: 'none', color: '#ffb347', border: 'none', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setMode('login'); setError(''); }}>Войти</button>
            </div>
          </form>
        )}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: #222;
          color: #fff;
          border-radius: 10px;
          padding: 32px 24px 24px 24px;
          min-width: 320px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
          max-width: 90vw;
        }
        .form-group {
          margin-bottom: 18px;
        }
        .form-group label {
          display: block;
          margin-bottom: 6px;
        }
        .form-group input {
          width: 100%;
          padding: 8px 10px;
          border-radius: 5px;
          border: 1px solid #444;
          background: #181818;
          color: #fff;
        }
        .form-group input:disabled {
          background: #333;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .modal-actions button {
          padding: 8px 18px;
          border-radius: 5px;
          border: none;
          background: #ffb347;
          color: #222;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        }
        .modal-actions button:disabled {
          background: #aaa;
          color: #666;
          cursor: not-allowed;
        }
        .error-message {
          background: #ff4d4f;
          color: #fff;
          padding: 8px 12px;
          border-radius: 5px;
          margin-bottom: 16px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default AuthModal; 