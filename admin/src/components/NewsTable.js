import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert, InputAdornment
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Save as SaveIcon, Cancel as CancelIcon, Article as NewsIcon } from '@mui/icons-material';
import RichTextEditor from '../RichTextEditor';

const NewsTable = ({ news, setNews }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Фильтрация новостей
  const filteredNews = news.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      (item.author && item.author.toLowerCase().includes(query)) ||
      item.content.toLowerCase().includes(query)
    );
  });

  const handleOpenModal = (item = null) => {
    setEditingNews(item);
    setTitle(item ? item.title : '');
    setContent(item ? item.content : '');
    setModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingNews(null);
    setTitle('');
    setContent('');
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const token = localStorage.getItem('adminToken');
    try {
      if (editingNews) {
        // Редактирование
        const res = await fetch(`/api/news/${editingNews.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ title, content })
        });
        if (!res.ok) throw new Error('Ошибка при обновлении новости');
        const updated = await res.json();
        setNews(news.map(n => n.id === editingNews.id ? updated : n));
        setSuccess('Новость успешно обновлена');
      } else {
        // Создание
        const res = await fetch('/api/news', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ title, content })
        });
        if (!res.ok) throw new Error('Ошибка при создании новости');
        const created = await res.json();
        setNews([created, ...news]);
        setSuccess('Новость успешно добавлена');
      }
      handleCloseModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/news/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Ошибка при удалении новости');
      setNews(news.filter(n => n.id !== id));
      setSuccess('Новость удалена');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ color: '#ffb347', display: 'flex', alignItems: 'center', gap: 1 }}>
          <NewsIcon /> Новости
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ ml: 'auto', bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}>
          Добавить
        </Button>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Поиск по новостям"
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
              <TableCell>Заголовок</TableCell>
              <TableCell>Автор</TableCell>
              <TableCell>Дата</TableCell>
              <TableCell>Кратко</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredNews.map(item => (
              <TableRow key={item.id} hover>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.author || '-'}</TableCell>
                <TableCell>{formatDate(item.createdAt)}</TableCell>
                <TableCell>{item.content.replace(/<[^>]*>/g, '').slice(0, 60)}...</TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => handleOpenModal(item)}><EditIcon /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleteId(item.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Модальное окно создания/редактирования */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>{editingNews ? 'Редактировать новость' : 'Добавить новость'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Заголовок" value={title} onChange={e => setTitle(e.target.value)} fullWidth required />
          <Typography variant="subtitle1" sx={{ color: '#ffb347' }}>Содержание:</Typography>
          <RichTextEditor value={content} onChange={setContent} placeholder="Введите текст новости..." />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} startIcon={<CancelIcon />}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained" startIcon={<SaveIcon />} disabled={loading || !title || !content}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Диалог удаления */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Удалить новость?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Отмена</Button>
          <Button onClick={() => handleDelete(deleteId)} color="error" variant="contained" disabled={loading}>Удалить</Button>
        </DialogActions>
      </Dialog>
      {success && <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
    </Box>
  );
};

export default NewsTable; 