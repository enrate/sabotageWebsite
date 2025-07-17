import React, { useState } from 'react';
import {
  Box, Typography, Button, Avatar, Tooltip, IconButton, Snackbar, Alert, Dialog
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon, Person as PersonIcon, Block as BlockIcon, Add as AddIcon } from '@mui/icons-material';
import UserEditorModal from './UserEditorModal';

const columns = (handleEdit, handleDelete, handleBan) => [
  {
    field: 'avatar',
    headerName: '',
    width: 56,
    sortable: false,
    renderCell: (params) => (
      <Avatar src={params.value} sx={{ width: 32, height: 32 }}>{params.row.username?.[0]}</Avatar>
    ),
  },
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'username', headerName: 'Имя', flex: 1, minWidth: 120 },
  { field: 'email', headerName: 'Email', flex: 1, minWidth: 160 },
  { field: 'role', headerName: 'Роль', width: 110 },
  { field: 'description', headerName: 'Описание', flex: 1, minWidth: 160 },
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
        <Tooltip title="Бан (в разработке)">
          <IconButton size="small" color="warning" onClick={() => handleBan(params.row)}><BlockIcon /></IconButton>
        </Tooltip>
      </Box>
    ),
  },
];

const UserTable = ({ users, refreshUsers }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleOpenModal = (item = null) => {
    setEditingUser(item);
    setModalOpen(true);
  };
  const handleCloseModal = (saved = false) => {
    setModalOpen(false);
    setEditingUser(null);
    if (saved) {
      refreshUsers();
      setSnackbar({ open: true, message: editingUser ? 'Пользователь обновлен' : 'Пользователь создан', severity: 'success' });
    }
  };
  const handleDelete = (id) => {
    setDeleteId(id);
    // TODO: реализовать удаление
    setSnackbar({ open: true, message: 'Пользователь удалён (заглушка)', severity: 'info' });
  };
  const handleBan = (user) => {
    setSnackbar({ open: true, message: 'Бан пользователя в разработке', severity: 'info' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon /> Пользователи
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ ml: 'auto' }}>
          Создать
        </Button>
      </Box>
      <Box sx={{ height: 540, width: '100%', bgcolor: 'background.paper', borderRadius: 3, boxShadow: 2 }}>
        <DataGrid
          rows={users}
          columns={columns(handleOpenModal, handleDelete, handleBan)}
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
      <UserEditorModal open={modalOpen} onClose={handleCloseModal} user={editingUser} />
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

export default UserTable; 