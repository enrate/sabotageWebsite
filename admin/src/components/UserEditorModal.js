import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, MenuItem, Box, Alert, FormControl, InputLabel, Select } from '@mui/material';

const emptyUser = { username: '', email: '', role: 'user', description: '' };

const UserEditorModal = ({ open, onClose, user }) => {
  const [form, setForm] = useState(emptyUser);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        email: user.email || '',
        role: user.role || 'user',
        description: user.description || ''
      });
    } else {
      setForm(emptyUser);
    }
    setError(null);
  }, [user, open]);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      let res;
      if (user) {
        res = await fetch(`/api/admin/users/${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error('Ошибка при обновлении пользователя');
      } else {
        res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error('Ошибка при создании пользователя');
      }
      onClose(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{user ? 'Редактировать пользователя' : 'Создать пользователя'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSave} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Имя" name="username" value={form.username} onChange={handleChange} fullWidth required />
          <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth />
          <FormControl fullWidth required>
            <InputLabel>Роль</InputLabel>
            <Select name="role" value={form.role} label="Роль" onChange={handleChange}>
              <MenuItem value="user">Пользователь</MenuItem>
              <MenuItem value="admin">Админ</MenuItem>
              <MenuItem value="moderator">Модератор</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Описание" name="description" value={form.description} onChange={handleChange} fullWidth />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={saving}>Отмена</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving || !form.username}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserEditorModal; 