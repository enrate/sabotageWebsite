import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert, InputAdornment, Avatar, Tooltip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, EmojiEvents as AwardIcon, People as PeopleIcon } from '@mui/icons-material';
import AwardEditorModal from '../AwardEditorModal';

const AwardTable = ({ awards, refreshAwards, onShowRecipients }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAward, setEditingAward] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Фильтрация наград
  const filteredAwards = awards.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      (item.type && item.type.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
  });

  const handleOpenModal = (item = null) => {
    setEditingAward(item);
    setModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = (saved = false) => {
    setModalOpen(false);
    setEditingAward(null);
    if (saved) {
      refreshAwards();
      setSuccess(editingAward ? 'Награда обновлена' : 'Награда создана');
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/awards/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Ошибка при удалении награды');
      refreshAwards();
      setSuccess('Награда удалена');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ color: '#ffb347', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AwardIcon /> Награды
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ ml: 'auto', bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}>
          Создать
        </Button>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Поиск по наградам"
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
              <TableCell>Иконка</TableCell>
              <TableCell>Название</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Категория</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAwards.map(item => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Avatar src={item.image} sx={{ bgcolor: '#ffb347', width: 40, height: 40 }}>
                    {!item.image && <AwardIcon />}
                  </Avatar>
                </TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.description?.slice(0, 60)}...</TableCell>
                <TableCell align="right">
                  <Tooltip title="Редактировать">
                    <IconButton size="small" color="primary" onClick={() => handleOpenModal(item)}><EditIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Удалить">
                    <IconButton size="small" color="error" onClick={() => setDeleteId(item.id)}><DeleteIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Получатели">
                    <IconButton size="small" color="info" onClick={() => onShowRecipients(item)}><PeopleIcon /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Модальное окно создания/редактирования */}
      <AwardEditorModal open={modalOpen} onClose={handleCloseModal} award={editingAward} />
      {/* Диалог удаления */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Удалить награду?</DialogTitle>
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

export default AwardTable; 