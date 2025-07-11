import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
  TextField
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, updateUser } = useAuth();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Отсутствует токен подтверждения');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const response = await axios.get(`/api/auth/verify-email/${token}`);
      
      // Автоматический вход после подтверждения
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        // Получаем пользователя с новым токеном
        try {
          const userRes = await axios.get('/api/auth/user', {
            headers: { Authorization: `Bearer ${response.data.token}` }
          });
          updateUser(userRes.data);
        } catch {}
        navigate('/');
      }
      
      setStatus('success');
      setMessage('Email успешно подтвержден! Вы будете перенаправлены на главную страницу.');
      
      // Перенаправление через 3 секунды
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      setStatus('error');
      if (err.response?.data?.message) {
        setMessage(err.response.data.message);
      } else {
        setMessage('Ошибка подтверждения email');
      }
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setResendSuccess(false);
    setMessage('');
    try {
      if (!resendEmail) {
        setMessage('Введите email для повторной отправки');
        setLoading(false);
        return;
      }
      const res = await axios.post('/api/auth/resend-verification', { email: resendEmail });
      setResendSuccess(true);
      setMessage(res.data.message || 'Письмо отправлено! Проверьте почту.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Ошибка отправки email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
        p: 2
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 3,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 179, 71, 0.2)',
          color: '#fff'
        }}
      >
        {status === 'loading' && (
          <>
            <CircularProgress sx={{ color: '#ffb347', mb: 2 }} />
            <Typography variant="h5" sx={{ color: '#ffb347', mb: 2 }}>
              Подтверждение email...
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Пожалуйста, подождите
            </Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircleIcon sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />
            <Typography variant="h5" sx={{ color: '#4caf50', mb: 2 }}>
              Email подтвержден!
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 3 }}>
              {message}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{
                bgcolor: '#ffb347',
                color: '#232526',
                '&:hover': {
                  bgcolor: '#e6a23c'
                }
              }}
            >
              Перейти на главную
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <ErrorIcon sx={{ fontSize: 64, color: '#f44336', mb: 2 }} />
            <Typography variant="h5" sx={{ color: '#f44336', mb: 2 }}>
              Ошибка подтверждения
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 3 }}>
              {message}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                sx={{
                  borderColor: '#ffb347',
                  color: '#ffb347',
                  '&:hover': {
                    borderColor: '#e6a23c',
                    color: '#e6a23c'
                  }
                }}
              >
                На главную
              </Button>
              <Box sx={{ width: '100%', maxWidth: 340, mt: 1 }}>
                <TextField
                  fullWidth
                  label="Email для повторной отправки"
                  variant="outlined"
                  value={resendEmail}
                  onChange={e => setResendEmail(e.target.value)}
                  disabled={loading || resendSuccess}
                  sx={{
                    mb: 1,
                    input: { color: '#fff' },
                    label: { color: '#ffb347' },
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: '#ffb347' },
                      '&:hover fieldset': { borderColor: '#ffd580' },
                      '&.Mui-focused fieldset': { borderColor: '#ffd580' }
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleResendVerification}
                  disabled={loading || resendSuccess}
                  sx={{
                    bgcolor: resendSuccess ? '#4caf50' : '#ffb347',
                    color: '#232526',
                    width: '100%',
                    '&:hover': {
                      bgcolor: resendSuccess ? '#43a047' : '#e6a23c'
                    }
                  }}
                >
                  {loading ? 'Отправка...' : resendSuccess ? 'Письмо отправлено!' : 'Отправить повторно'}
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default VerifyEmailPage; 