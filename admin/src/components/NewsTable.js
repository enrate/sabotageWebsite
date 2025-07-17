import React, { useState } from 'react';
import {
  Box, Typography, Button, Tooltip, IconButton, Snackbar, Alert, Dialog
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Article as NewsIcon } from '@mui/icons-material';
import RichTextEditor from '../RichTextEditor';
import axios from 'axios';

function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU');
}

const columns = (handleEdit, handleDelete) => [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'title', headerName: 'Заголовок', flex: 1, minWidth: 160 },
  {
    field: 'author',
    headerName: 'Автор',
    width: 140,
    valueGetter: (params) => (params) ? params.username : 'Автор не найден'
  },
  {
    field: 'createdAt',
    headerName: 'Дата',
    width: 120,
    valueGetter: (params) => {
      if (!params) return '—';
      return formatDate(params);
    },
  },
  {
    field: 'content',
    headerName: 'Кратко',
    flex: 2,
    minWidth: 200,
    valueGetter: (params) => {
      const text = params || '';
      return text.replace(/<[^>]*>/g, '').slice(0, 60) + '...';
    }
  },
  {
    field: 'actions',
    headerName: '',
    width: 120,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Редактировать">
          <IconButton size="small" color="primary" onClick={() => handleEdit(params.row)}><EditIcon /></IconButton>
        </Tooltip>
        <Tooltip title="Удалить">
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row)}><DeleteIcon /></IconButton>
        </Tooltip>
      </Box>
    ),
  },
];

const NewsTable = ({ news, setNews }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOpenModal = (item = null) => {
    setEditingNews(item);
    setTitle(item ? item.title : '');
    setContent(item ? item.content : '');
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingNews(null);
    setTitle('');
    setContent('');
  };

  // --- СОХРАНЕНИЕ (создание/редактирование) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      let response;
      if (editingNews) {
        // Редактирование
        response = await axios.put(`/api/admin/news/${editingNews.id}`, { title, content }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setNews(prev => prev.map(n => n.id === editingNews.id ? { ...response.data, id: response.data.id || response.data.newsId } : n));
        setSnackbar({ open: true, message: 'Новость обновлена', severity: 'success' });
      } else {
        // Создание
        response = await axios.post('/api/admin/news', { title, content }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setNews(prev => [{ ...response.data, id: response.data.id || response.data.newsId }, ...prev]);
        setSnackbar({ open: true, message: 'Новость создана', severity: 'success' });
      }
      handleCloseModal();
    } catch (err) {
      setSnackbar({ open: true, message: 'Ошибка при сохранении', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- УДАЛЕНИЕ ---
  const handleDelete = async (item) => {
    setDeleteId(item.id);
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      await axios.delete(`/api/admin/news/${item.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setNews(prev => prev.filter(n => n.id !== item.id));
      setSnackbar({ open: true, message: 'Новость удалена', severity: 'info' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Ошибка при удалении', severity: 'error' });
    } finally {
      setDeleteId(null);
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <NewsIcon /> Новости
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ ml: 'auto' }}>
          Добавить
        </Button>
      </Box>
      <Box sx={{ height: 540, width: '100%', bgcolor: 'background.paper', borderRadius: 3, boxShadow: 2 }}>
        <DataGrid
          rows={news}
          columns={columns(handleOpenModal, handleDelete)}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          autoHeight={false}
          getRowId={row => row.id || row.newsId}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default', color: 'text.secondary', fontWeight: 700 },
            '& .MuiDataGrid-row': { bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } },
            '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
            color: 'text.primary',
          }}
        />
      </Box>
      {/* Модальное окно создания/редактирования */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ color: 'primary.main' }}>{editingNews ? 'Редактировать новость' : 'Добавить новость'}</Typography>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Заголовок" required style={{ fontSize: 18, padding: 8, borderRadius: 8, border: '1px solid #333', background: '#23272f', color: '#fff' }} />
            <Typography variant="subtitle1" sx={{ color: 'primary.main' }}>Содержание:</Typography>
            <RichTextEditor value={content} onChange={setContent} placeholder="Введите текст новости..." />
            <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'flex-end' }}>
              <Button onClick={handleCloseModal}>Отмена</Button>
              <Button type="submit" variant="contained" disabled={!title || !content || loading}>{editingNews ? 'Сохранить' : 'Добавить'}</Button>
            </Box>
          </Box>
        </form>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {/* Диалог удаления (реализовать по необходимости) */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <Box sx={{ p: 3 }}>
          <Typography>Вы уверены, что хотите удалить новость?</Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'flex-end' }}>
            <Button onClick={() => setDeleteId(null)}>Отмена</Button>
            <Button color="error" variant="contained" onClick={() => handleDelete({ id: deleteId })} disabled={loading}>Удалить</Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default NewsTable; 