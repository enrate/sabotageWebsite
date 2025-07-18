import React, { useState } from 'react';
import {
  Box, Typography, Avatar, Tooltip, IconButton, Snackbar, Alert, Dialog, Button, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, EmojiEvents as AwardIcon, People as PeopleIcon } from '@mui/icons-material';
import AwardEditorModal from '../AwardEditorModal';
import axios from 'axios';

const columns = (handleEdit, handleDelete, handleRecipients) => [
  {
    field: 'image',
    headerName: '',
    width: 56,
    sortable: false,
    renderCell: (params) => (
      <Avatar src={params.value} sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
        {!params.value && <AwardIcon />}
      </Avatar>
    ),
  },
  { field: 'name', headerName: 'Название', flex: 1, minWidth: 140 },
  { field: 'type', headerName: 'Тип', width: 120 },
  { field: 'category', headerName: 'Категория', width: 120 },
  {
    field: 'description',
    headerName: 'Описание',
    flex: 2,
    minWidth: 180,
    valueGetter: (params) => (params) ? params?.slice(0, 60) + '...' : 'Нет описания'
  },
  {
    field: 'actions',
    headerName: '',
    width: 140,
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
        <Tooltip title="Получатели">
          <IconButton size="small" color="info" onClick={() => handleRecipients(params.row)}><PeopleIcon /></IconButton>
        </Tooltip>
      </Box>
    ),
  },
];

const AwardTable = ({ awards, refreshAwards, onShowRecipients }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAward, setEditingAward] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleOpenModal = (item = null) => {
    setEditingAward(item);
    setModalOpen(true);
  };
  const handleCloseModal = (saved = false) => {
    setModalOpen(false);
    setEditingAward(null);
    if (saved) {
      refreshAwards();
      setSnackbar({ open: true, message: editingAward ? 'Награда обновлена' : 'Награда создана', severity: 'success' });
    }
  };
  const handleDelete = (id) => {
    setDeleteId(id);
  };
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      await axios.delete(`/api/admin/awards/${deleteId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSnackbar({ open: true, message: 'Награда удалена', severity: 'success' });
      setDeleteId(null);
      refreshAwards();
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.error || 'Ошибка при удалении', severity: 'error' });
      setDeleteId(null);
    }
  };
  const handleRecipients = (award) => {
    if (onShowRecipients) onShowRecipients(award);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AwardIcon /> Награды
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ ml: 'auto' }}>
          Создать
        </Button>
      </Box>
      <Box sx={{ height: 540, width: '100%', bgcolor: 'background.paper', borderRadius: 3, boxShadow: 2 }}>
        <DataGrid
          rows={awards}
          columns={columns(handleOpenModal, handleDelete, handleRecipients)}
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
      <AwardEditorModal open={modalOpen} onClose={handleCloseModal} award={editingAward} />
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {/* Диалог удаления (реализовать по необходимости) */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Удалить награду?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить эту награду? Это действие необратимо. Нельзя удалить награду, если она уже выдана хотя бы одному получателю.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Отмена</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Удалить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AwardTable; 