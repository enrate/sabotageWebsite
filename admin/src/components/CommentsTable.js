import React, { useState } from 'react';
import {
  Box, Typography, TextField, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Dialog, DialogTitle, DialogActions, Alert, InputAdornment, Tooltip, Button, Avatar
} from '@mui/material';
import { Search as SearchIcon, Visibility as VisibilityIcon, Delete as DeleteIcon, Person as PersonIcon, Block as BlockIcon } from '@mui/icons-material';
import CommentDetailModal from './CommentDetailModal';

const CommentsTable = ({ comments, refreshComments }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Фильтрация комментариев
  const filteredComments = comments.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      String(item.id).includes(query) ||
      (item.author?.username && item.author.username.toLowerCase().includes(query)) ||
      (item.text && item.text.toLowerCase().includes(query)) ||
      (item.targetType && item.targetType.toLowerCase().includes(query))
    );
  });

  const handleOpenDetail = (comment) => {
    setSelectedComment(comment);
    setDetailOpen(true);
  };
  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedComment(null);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Ошибка при удалении комментария');
      refreshComments();
      setSuccess('Комментарий удалён');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  // TODO: реализовать бан пользователя
  const handleBan = (comment) => {
    alert('Бан пользователя в разработке');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ color: '#ffb347', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon /> Комментарии
        </Typography>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Поиск по комментариям"
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
              <TableCell>Автор</TableCell>
              <TableCell>Текст</TableCell>
              <TableCell>Объект</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredComments.map(item => (
              <TableRow key={item.id} hover>
                <TableCell>{item.id}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={item.author?.avatar} sx={{ width: 28, height: 28 }}>{item.author?.username?.[0]}</Avatar>
                    {item.author?.username}
                  </Box>
                </TableCell>
                <TableCell>{item.text?.slice(0, 60)}...</TableCell>
                <TableCell>{item.targetType} #{item.targetId}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Просмотр/редактировать">
                    <IconButton size="small" color="primary" onClick={() => handleOpenDetail(item)}><VisibilityIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Удалить">
                    <IconButton size="small" color="error" onClick={() => setDeleteId(item.id)}><DeleteIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Бан автора (в разработке)">
                    <IconButton size="small" color="warning" onClick={() => handleBan(item)}><BlockIcon /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Модальное окно просмотра/редактирования */}
      <CommentDetailModal open={detailOpen} onClose={handleCloseDetail} comment={selectedComment} onSave={refreshComments} />
      {/* Диалог удаления */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Удалить комментарий?</DialogTitle>
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

export default CommentsTable; 