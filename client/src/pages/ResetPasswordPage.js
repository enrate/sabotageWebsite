import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const token = query.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!password || !confirmPassword) {
      setError('Введите новый пароль и подтверждение');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Ошибка сброса пароля');
      setSuccess('Пароль успешно изменён! Теперь вы можете войти.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#232526' }}>
      <div style={{ background: '#2c2f34', padding: 32, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', minWidth: 320, color: '#fff' }}>
        <h2 style={{ color: '#ffb347', marginBottom: 24 }}>Сброс пароля</h2>
        {error && <div style={{ color: '#f44336', marginBottom: 16 }}>{error}</div>}
        {success ? (
          <>
            <div style={{ color: '#52c41a', marginBottom: 16 }}>{success}</div>
            <button style={{ background: '#ffb347', color: '#232526', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/login')}>Войти</button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Новый пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', background: '#232526', color: '#fff' }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Повторите пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', background: '#232526', color: '#fff' }}
              />
            </div>
            <button type="submit" disabled={loading} style={{ background: '#ffb347', color: '#232526', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
              {loading ? 'Сброс...' : 'Сбросить пароль'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage; 