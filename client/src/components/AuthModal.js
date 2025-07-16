import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './CreateSquadModal.css';
import { register } from '../services/register';
import CloseIcon from '@mui/icons-material/Close';

const AuthModal = ({ onClose, onShowSnackbar }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
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
        onShowSnackbar('Регистрация успешна! Проверьте ваш email для подтверждения аккаунта. Сообщение могло попасть в спам.');
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

  // Новый обработчик для восстановления пароля
  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setForgotSuccess('');
    setLoading(true);
    try {
      // TODO: заменить на реальный endpoint
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Ошибка восстановления пароля');
      setForgotSuccess('Письмо с восстановлением пароля отправлено на почту, если данные верны.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Закрытие по клику вне модалки (убираем)
  // const handleOverlayClick = (e) => {
  //   if (e.target === e.currentTarget) {
  //     onClose();
  //   }
  // };

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
      // onClick={handleOverlayClick} // убираем закрытие по клику вне
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
        {/* Крестик для закрытия */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            color: '#ffb347',
            fontSize: 28,
            cursor: 'pointer',
            zIndex: 2
          }}
          aria-label="Закрыть"
        >
          <CloseIcon />
        </button>
        <h2>{mode === 'login' ? 'Авторизация' : mode === 'register' ? 'Регистрация' : 'Восстановление пароля'}</h2>
        {error && <div className="error-message">{error}</div>}
        {forgotSuccess && <div className="success-message">{forgotSuccess}</div>}
        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email или никнейм</label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="Email или никнейм"
              />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ marginBottom: 0 }}>Пароль</label>
              <button type="button" style={{ background: 'none', color: '#ffb347', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 14, padding: 0 }} onClick={() => { setMode('forgot'); setError(''); setForgotSuccess(''); }}>Забыли пароль?</button>
            </div>
            <div className="form-group">
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
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              Нет аккаунта?{' '}
              <button type="button" style={{ background: 'none', color: '#ffb347', border: 'none', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setMode('register'); setError(''); }}>Зарегистрироваться</button>
            </div>
          </form>
        ) : mode === 'register' ? (
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
        ) : (
          <form onSubmit={handleForgot}>
            <div className="form-group">
              <label>Никнейм</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                disabled={loading}
                placeholder="Ваш никнейм"
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
                placeholder="Ваш email"
              />
            </div>
            <div className="modal-actions">
              <button type="button" onClick={onClose} disabled={loading}>Отмена</button>
              <button type="submit" disabled={loading}>{loading ? 'Отправка...' : 'Восстановить пароль'}</button>
            </div>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button type="button" style={{ background: 'none', color: '#ffb347', border: 'none', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setMode('login'); setError(''); setForgotSuccess(''); }}>Вернуться к авторизации</button>
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
        .success-message {
          background: #52c41a;
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