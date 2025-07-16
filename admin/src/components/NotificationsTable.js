import React, { useState } from 'react';
import {
  Box, Typography, TextField, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Dialog, DialogTitle, DialogActions, Alert, InputAdornment, Tooltip, Button, Avatar
} from '@mui/material';
import { Search as SearchIcon, Visibility as VisibilityIcon, Delete as DeleteIcon, MarkEmailRead as ReadIcon, Notifications as NotificationsIcon } from '@mui/icons-material';
import NotificationDetailModal from './NotificationDetailModal';

const NotificationsTable = ({ notifications, refreshNotifications }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Фильтрация уведомлений
  const filteredNotifications = notifications.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      String(item.id).includes(query) ||
      (item.recipient?.username && item.recipient.username.toLowerCase().includes(query)) ||
      (item.message && item.message.toLowerCase().includes(query)) ||
      (item.type && item.type.toLowerCase().includes(query))
    );
  });

  const handleOpenDetail = (notification) => {
    setSelectedNotification(notification);
    setDetailOpen(true);
  };
  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedNotification(null);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Ошибка при удалении уведомления');
      refreshNotifications();
      setSuccess('Уведомление удалено');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  const handleMarkRead = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/notifications/${id}/read`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Ошибка при отметке как прочитанное');
      refreshNotifications();
      setSuccess('Уведомление отмечено как прочитанное');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ color: '#ffb347', display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon /> Уведомления
        </Typography>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Поиск по уведомлениям"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Получатель</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Текст</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredNotifications.map(item => (
              <TableRow key={item.id} hover>
                <TableCell>{item.id}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={item.recipient?.avatar} sx={{ width: 28, height: 28 }}>{item.recipient?.username?.[0]}</Avatar>
                    {item.recipient?.username}
                  </Box>
                </TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.message?.slice(0, 60)}...</TableCell>
                <TableCell>{item.read ? 'Прочитано' : 'Непрочитано'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Просмотр/редактировать">
                    <IconButton size="small" color="primary" onClick={() => handleOpenDetail(item)}><VisibilityIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Удалить">
                    <IconButton size="small" color="error" onClick={() => setDeleteId(item.id)}><DeleteIcon /></IconButton>
                  </Tooltip>
                  {!item.read && (
                    <Tooltip title="Отметить как прочитанное">
                      <IconButton size="small" color="success" onClick={() => handleMarkRead(item.id)}><ReadIcon /></IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Модальное окно просмотра/редактирования */}
      <NotificationDetailModal open={detailOpen} onClose={handleCloseDetail} notification={selectedNotification} onSave={refreshNotifications} />
      {/* Диалог удаления */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Удалить уведомление?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Отмена</Button>
          <Button onClick={() => handleDelete(deleteId)} color="error" variant="contained" disabled={loading}>Удалить</Button>
        </DialogActions>
      </Dialog>
      {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
    </Box>
  );
};

export default NotificationsTable; 