import React, { useState } from 'react';
import {
  Box, Typography, Button, Avatar, Tooltip, IconButton, Snackbar, Alert, Dialog
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Group as GroupIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import SquadEditorModal from './SquadEditorModal';
import { useNavigate } from 'react-router-dom';

const columns = (handleEdit, handleDelete, handleDetails) => [
  {
    field: 'icon',
    headerName: '',
    width: 56,
    sortable: false,
    renderCell: () => (
      <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
        <GroupIcon />
      </Avatar>
    ),
  },
  { field: 'name', headerName: 'Название', flex: 1, minWidth: 140 },
  { field: 'tag', headerName: 'Тег', width: 100 },
  {
    field: 'createdAt',
    headerName: 'Создан',
    width: 110,
    valueGetter: (params) => {
      if (!params.value) return '—';
      const d = new Date(params.value);
      return d.toLocaleDateString('ru-RU');
    }
  },
  {
    field: 'membersCount',
    headerName: 'Участники',
    width: 110,
    valueGetter: (params) => Array.isArray(params.row.members) ? params.row.members.length : 0
  },
  {
    field: 'leaderName',
    headerName: 'Лидер',
    width: 140,
    valueGetter: (params) => params.row.leader?.username || '—'
  },
  {
    field: 'description',
    headerName: 'Описание',
    flex: 2,
    minWidth: 180,
    valueGetter: (params) => {
      const desc = params.value;
      if (!desc || desc.trim() === '') return '—';
      return desc.length > 60 ? desc.slice(0, 60) + '…' : desc;
    }
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
        <Tooltip title="Детали">
          <IconButton size="small" color="info" onClick={() => handleDetails(params.row.id)}><OpenInNewIcon /></IconButton>
        </Tooltip>
      </Box>
    ),
  },
];

const SquadTable = ({ squads, refreshSquads }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSquad, setEditingSquad] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  const handleOpenModal = (item = null) => {
    setEditingSquad(item);
    setModalOpen(true);
  };
  const handleCloseModal = (saved = false) => {
    setModalOpen(false);
    setEditingSquad(null);
    if (saved) {
      refreshSquads();
      setSnackbar({ open: true, message: editingSquad ? 'Сквад обновлён' : 'Сквад создан', severity: 'success' });
    }
  };
  const handleDelete = (id) => {
    setDeleteId(id);
    // TODO: реализовать удаление
    setSnackbar({ open: true, message: 'Сквад удалён (заглушка)', severity: 'info' });
  };
  const handleDetails = (id) => {
    navigate(`/squads/${id}`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon /> Отряды
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ ml: 'auto' }}>
          Создать
        </Button>
      </Box>
      <Box sx={{ height: 540, width: '100%', bgcolor: 'background.paper', borderRadius: 3, boxShadow: 2 }}>
        <DataGrid
          rows={squads}
          columns={columns(handleOpenModal, handleDelete, handleDetails)}
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
      <SquadEditorModal open={modalOpen} onClose={handleCloseModal} squad={editingSquad} />
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

export default SquadTable; 