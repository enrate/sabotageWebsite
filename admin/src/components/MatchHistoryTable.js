import React, { useState } from 'react';
import {
  Box, Typography, TextField, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Dialog, DialogTitle, DialogActions, Alert, InputAdornment, Tooltip, Button
} from '@mui/material';
import { Search as SearchIcon, Visibility as VisibilityIcon, Delete as DeleteIcon, SportsEsports as GameIcon } from '@mui/icons-material';
import MatchDetailModal from './MatchDetailModal';

const MatchHistoryTable = ({ matches, refreshMatches }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Фильтрация матчей
  const filteredMatches = matches.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      String(item.id).includes(query) ||
      (item.type && item.type.toLowerCase().includes(query)) ||
      (item.status && item.status.toLowerCase().includes(query))
    );
  });

  const handleOpenDetail = (match) => {
    setSelectedMatch(match);
    setDetailOpen(true);
  };
  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedMatch(null);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/match-history/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Ошибка при удалении матча');
      refreshMatches();
      setSuccess('Матч удалён');
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
          <GameIcon /> История матчей
        </Typography>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Поиск по матчам"
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
              <TableCell>Дата</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMatches.map(item => (
              <TableRow key={item.id} hover>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.date ? new Date(item.date).toLocaleString('ru-RU') : '-'}</TableCell>
                <TableCell>{item.type || '-'}</TableCell>
                <TableCell>{item.status || '-'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Просмотр">
                    <IconButton size="small" color="primary" onClick={() => handleOpenDetail(item)}><VisibilityIcon /></IconButton>
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
      {/* Модальное окно деталей матча */}
      <MatchDetailModal open={detailOpen} onClose={handleCloseDetail} match={selectedMatch} />
      {/* Диалог удаления */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Удалить матч?</DialogTitle>
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

export default MatchHistoryTable; 