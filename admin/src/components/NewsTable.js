import React, { useState } from 'react';
import {
  Box, Typography, Button, Tooltip, IconButton, Snackbar, Alert, Dialog
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Article as NewsIcon } from '@mui/icons-material';
import RichTextEditor from '../RichTextEditor';

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('ru-RU');
}

const columns = (handleEdit, handleDelete) => [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'title', headerName: 'Заголовок', flex: 1, minWidth: 160 },
  { field: 'author', headerName: 'Автор', width: 140 },
  {
    field: 'createdAt',
    headerName: 'Дата',
    width: 160,
    valueGetter: (params) => formatDate(params.value),
  },
  {
    field: 'content',
    headerName: 'Кратко',
    flex: 2,
    minWidth: 200,
    valueGetter: (params) => params.value.replace(/<[^>]*>/g, '').slice(0, 60) + '...'
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
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}><DeleteIcon /></IconButton>
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
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: реализовать сохранение через API
    setSnackbar({ open: true, message: editingNews ? 'Новость обновлена' : 'Новость создана', severity: 'success' });
    handleCloseModal();
  };
  const handleDelete = (id) => {
    setDeleteId(id);
    // TODO: реализовать удаление
    setSnackbar({ open: true, message: 'Новость удалена (заглушка)', severity: 'info' });
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
              <Button type="submit" variant="contained" disabled={!title || !content}>{editingNews ? 'Сохранить' : 'Добавить'}</Button>
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
        {/* ... */}
      </Dialog>
    </Box>
  );
};

export default NewsTable; 