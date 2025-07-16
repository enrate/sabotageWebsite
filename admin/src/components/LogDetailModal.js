import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';

const LogDetailModal = ({ open, onClose, log }) => {
  if (!log) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Детали лога #{log.id}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Тип: {log.type}</Typography>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Пользователь: {log.user?.username || '-'}</Typography>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Дата: {log.createdAt ? new Date(log.createdAt).toLocaleString('ru-RU') : '-'}</Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{log.message}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogDetailModal; 