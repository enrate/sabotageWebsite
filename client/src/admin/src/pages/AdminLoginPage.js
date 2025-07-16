import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, TextField, Card } from '@mui/joy';

const AdminLoginPage = () => {
  const { login, loading, error, user } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.body' }}>
      <Card sx={{ minWidth: 350, p: 4 }}>
        <Typography level="h3" gutterBottom>Вход в админку</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          {error && <Typography color="danger" sx={{ mb: 2 }}>{error}</Typography>}
          <Button type="submit" loading={loading} fullWidth>Войти</Button>
        </form>
      </Card>
    </Box>
  );
};

export default AdminLoginPage; 