import React, { useState } from 'react';
import {
  Box, Typography, TextField, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Dialog, DialogTitle, DialogActions, Alert, InputAdornment, Tooltip, Button, Avatar
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Person as PersonIcon, Block as BlockIcon } from '@mui/icons-material';
import UserEditorModal from './UserEditorModal';

const UserTable = ({ users, refreshUsers }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Фильтрация пользователей
  const filteredUsers = users.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.username.toLowerCase().includes(query) ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      item.role.toLowerCase().includes(query)
    );
  });

  const handleOpenModal = (item = null) => {
    setEditingUser(item);
    setModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = (saved = false) => {
    setModalOpen(false);
    setEditingUser(null);
    if (saved) {
      refreshUsers();
      setSuccess(editingUser ? 'Пользователь обновлен' : 'Пользователь создан');
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Ошибка при удалении пользователя');
      refreshUsers();
      setSuccess('Пользователь удалён');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  // TODO: реализовать бан пользователя
  const handleBan = (user) => {
    alert('Бан пользователя в разработке');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ color: '#ffb347', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon /> Пользователи
        </Typography>
        <Button variant="contained" onClick={() => handleOpenModal()} sx={{ ml: 'auto', bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}>
          Создать
        </Button>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Поиск по пользователям"
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
              <TableCell>Аватар</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Имя</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map(item => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Avatar src={item.avatar} sx={{ width: 32, height: 32 }}>{item.username[0]}</Avatar>
                </TableCell>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.username}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.role}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Редактировать">
                    <IconButton size="small" color="primary" onClick={() => handleOpenModal(item)}><EditIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Удалить">
                    <IconButton size="small" color="error" onClick={() => setDeleteId(item.id)}><DeleteIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Бан (в разработке)">
                    <IconButton size="small" color="warning" onClick={() => handleBan(item)}><BlockIcon /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Модальное окно создания/редактирования */}
      <UserEditorModal open={modalOpen} onClose={handleCloseModal} user={editingUser} />
      {/* Диалог удаления */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Удалить пользователя?</DialogTitle>
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

export default UserTable; 