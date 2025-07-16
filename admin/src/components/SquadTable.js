import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Dialog, DialogTitle, DialogActions, Alert, InputAdornment, Avatar, Tooltip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Group as GroupIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import SquadEditorModal from './SquadEditorModal';
import { useNavigate } from 'react-router-dom';

const SquadTable = ({ squads, refreshSquads }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSquad, setEditingSquad] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Фильтрация сквадов
  const filteredSquads = squads.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      (item.tag && item.tag.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
  });

  const handleOpenModal = (item = null) => {
    setEditingSquad(item);
    setModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = (saved = false) => {
    setModalOpen(false);
    setEditingSquad(null);
    if (saved) {
      refreshSquads();
      setSuccess(editingSquad ? 'Отряд обновлен' : 'Отряд создан');
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`/api/squads/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Ошибка при удалении отряда');
      refreshSquads();
      setSuccess('Отряд удален');
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
          <GroupIcon /> Сквады
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ ml: 'auto', bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}>
          Создать
        </Button>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Поиск по сквадам"
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
              <TableCell>Тег</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSquads.map(item => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Avatar sx={{ bgcolor: '#ffb347', width: 40, height: 40 }}>
                    <GroupIcon />
                  </Avatar>
                </TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.tag}</TableCell>
                <TableCell>{item.description?.slice(0, 60)}...</TableCell>
                <TableCell align="right">
                  <Tooltip title="Редактировать">
                    <IconButton size="small" color="primary" onClick={() => handleOpenModal(item)}><EditIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Удалить">
                    <IconButton size="small" color="error" onClick={() => setDeleteId(item.id)}><DeleteIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Детали">
                    <IconButton size="small" color="info" onClick={() => navigate(`/squads/${item.id}`)}><OpenInNewIcon /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Модальное окно создания/редактирования */}
      <SquadEditorModal open={modalOpen} onClose={handleCloseModal} squad={editingSquad} />
      {/* Диалог удаления */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Удалить отряд?</DialogTitle>
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

export default SquadTable; 