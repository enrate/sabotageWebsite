import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField, Box, Alert } from '@mui/material';

const NotificationDetailModal = ({ open, onClose, notification, onSave }) => {
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMessage(notification?.message || '');
    setError(null);
  }, [notification, open]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/notifications/${notification.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message })
      });
      if (!res.ok) throw new Error('Ошибка при сохранении уведомления');
      onSave && onSave();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!notification) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Уведомление #{notification.id}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Получатель: {notification.recipient?.username || '-'}</Typography>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Тип: {notification.type || '-'}</Typography>
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Текст уведомления"
            value={message}
            onChange={e => setMessage(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving || !message}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationDetailModal; 