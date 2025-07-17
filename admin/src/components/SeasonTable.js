import React, { useState } from 'react';
import {
  Box, Typography, Button, Tooltip, IconButton, Snackbar, Alert, Dialog
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, CalendarMonth as CalendarIcon, EmojiEvents as AwardIcon } from '@mui/icons-material';
import SeasonEditorModal from './SeasonEditorModal';

const columns = (handleEdit, handleDelete, awards) => [
  { field: 'name', headerName: 'Название', flex: 1, minWidth: 140 },
  {
    field: 'startDate',
    headerName: 'Начало',
    width: 120,
    valueGetter: (params) => params.value?.slice(0, 10) || '-'
  },
  {
    field: 'endDate',
    headerName: 'Окончание',
    width: 120,
    valueGetter: (params) => params.value?.slice(0, 10) || '-'
  },
  {
    field: 'trophies',
    headerName: 'Кубки',
    flex: 2,
    minWidth: 180,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', gap: 1 }}>
        {[1,2,3].map(place => {
          const trophy = params.row[`trophy${place}`];
          return trophy ? (
            <Tooltip key={place} title={`Кубок за ${place} место: ${trophy.name}`}>
              <span style={{ display: 'flex', alignItems: 'center', marginRight: 8 }}><AwardIcon sx={{ color: 'secondary.main', mr: 0.5, fontSize: 18 }} />{trophy.name}</span>
            </Tooltip>
          ) : null;
        })}
      </Box>
    )
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

const SeasonTable = ({ seasons, awards, refreshSeasons }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleOpenModal = (item = null) => {
    setEditingSeason(item);
    setModalOpen(true);
  };
  const handleCloseModal = (saved = false) => {
    setModalOpen(false);
    setEditingSeason(null);
    if (saved) {
      refreshSeasons();
      setSnackbar({ open: true, message: editingSeason ? 'Сезон обновлён' : 'Сезон создан', severity: 'success' });
    }
  };
  const handleDelete = (id) => {
    setDeleteId(id);
    // TODO: реализовать удаление
    setSnackbar({ open: true, message: 'Сезон удалён (заглушка)', severity: 'info' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon /> Сезоны
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ ml: 'auto' }}>
          Создать
        </Button>
      </Box>
      <Box sx={{ height: 540, width: '100%', bgcolor: 'background.paper', borderRadius: 3, boxShadow: 2 }}>
        <DataGrid
          rows={seasons}
          columns={columns(handleOpenModal, handleDelete, awards)}
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
      <SeasonEditorModal open={modalOpen} onClose={handleCloseModal} season={editingSeason} awards={awards} />
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

export default SeasonTable; 