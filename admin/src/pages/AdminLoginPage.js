import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';
import { FormControl, FormLabel, Input, Button, Typography, Card, Box } from '@mui/joy';

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
          <FormControl required sx={{ mb: 2 }}>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth
            />
          </FormControl>
          <FormControl required sx={{ mb: 2 }}>
            <FormLabel>Пароль</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
            />
          </FormControl>
          {error && <Typography color="danger" sx={{ mb: 2 }}>{error}</Typography>}
          <Button type="submit" loading={loading} fullWidth>Войти</Button>
        </form>
      </Card>
    </Box>
  );
};

export default AdminLoginPage;