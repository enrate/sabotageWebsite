import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Dialog, DialogTitle, DialogActions, Alert, InputAdornment, Tooltip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, CalendarMonth as CalendarIcon, EmojiEvents as AwardIcon } from '@mui/icons-material';
import SeasonEditorModal from './SeasonEditorModal';

const SeasonTable = ({ seasons, awards, refreshSeasons }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Фильтрация сезонов
  const filteredSeasons = seasons.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query)
      || (item.startDate && item.startDate.includes(query))
      || (item.endDate && item.endDate.includes(query))
    );
  });

  const handleOpenModal = (item = null) => {
    setEditingSeason(item);
    setModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = (saved = false) => {
    setModalOpen(false);
    setEditingSeason(null);
    if (saved) {
      refreshSeasons();
      setSuccess(editingSeason ? 'Сезон обновлен' : 'Сезон создан');
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/seasons/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Ошибка при удалении сезона');
      refreshSeasons();
      setSuccess('Сезон удален');
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
          <CalendarIcon /> Сезоны
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ ml: 'auto', bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}>
          Создать
        </Button>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Поиск по сезонам"
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
              <TableCell>Название</TableCell>
              <TableCell>Начало</TableCell>
              <TableCell>Окончание</TableCell>
              <TableCell>Кубки</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSeasons.map(item => (
              <TableRow key={item.id} hover>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.startDate?.slice(0,10)}</TableCell>
                <TableCell>{item.endDate?.slice(0,10)}</TableCell>
                <TableCell>
                  {[1,2,3].map(place => {
                    const trophy = item[`trophy${place}`];
                    return trophy ? (
                      <Tooltip key={place} title={`Кубок за ${place} место: ${trophy.name}`}>
                        <span style={{ marginRight: 8 }}><AwardIcon sx={{ color: '#ffb347', mr: 0.5, fontSize: 18 }} />{trophy.name}</span>
                      </Tooltip>
                    ) : null;
                  })}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Редактировать">
                    <IconButton size="small" color="primary" onClick={() => handleOpenModal(item)}><EditIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Удалить">
                    <IconButton size="small" color="error" onClick={() => setDeleteId(item.id)}><DeleteIcon /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Модальное окно создания/редактирования */}
      <SeasonEditorModal open={modalOpen} onClose={handleCloseModal} season={editingSeason} awards={awards} />
      {/* Диалог удаления */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Удалить сезон?</DialogTitle>
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

export default SeasonTable; 