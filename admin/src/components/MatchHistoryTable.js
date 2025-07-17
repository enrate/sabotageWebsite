import React, { useState } from 'react';
import {
  Box, Typography, Tooltip, IconButton, Snackbar, Alert, Dialog
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Visibility as VisibilityIcon, Delete as DeleteIcon, SportsEsports as GameIcon } from '@mui/icons-material';
import MatchDetailModal from './MatchDetailModal';

const columns = (handleDetail, handleDelete) => [
  { field: 'id', headerName: 'ID', width: 80 },
  {
    field: 'date',
    headerName: 'Дата',
    width: 180,
    valueGetter: (params) => params.value ? new Date(params.value).toLocaleString('ru-RU') : '-'
  },
  {
    field: 'missionName',
    headerName: 'Сценарий',
    width: 200,
    valueGetter: (params) => params.value || '-'
  },
  {
    field: 'playersCount',
    headerName: 'Игроков',
    width: 100,
    valueGetter: (params) => {
      console.log('[DEBUG] params:', params);
      if (params && params.row && Array.isArray(params.row.players)) return params.row.players.length;
      return '-';
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
        <Tooltip title="Просмотр">
          <IconButton size="small" color="primary" onClick={() => handleDetail(params.row)}><VisibilityIcon /></IconButton>
        </Tooltip>
        <Tooltip title="Удалить">
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}><DeleteIcon /></IconButton>
        </Tooltip>
      </Box>
    ),
  },
];

const mapMatchRow = (row) => ({
  ...row,
  id: row.id || row.sessionId || row.matchId || row._id || row.uuid
});

const MatchHistoryTable = ({ matches, refreshMatches }) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleOpenDetail = (match) => {
    setSelectedMatch(match);
    setDetailOpen(true);
  };
  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedMatch(null);
  };
  const handleDelete = (id) => {
    setDeleteId(id);
    // TODO: реализовать удаление
    setSnackbar({ open: true, message: 'Матч удалён (заглушка)', severity: 'info' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <GameIcon /> История матчей
        </Typography>
      </Box>
      <Box sx={{ height: 540, width: '100%', bgcolor: 'background.paper', borderRadius: 3, boxShadow: 2 }}>
        <DataGrid
          rows={matches.map(mapMatchRow)}
          columns={columns(handleOpenDetail, handleDelete)}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          autoHeight={false}
          getRowId={row => row.id || row.sessionId || row.matchId}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default', color: 'text.secondary', fontWeight: 700 },
            '& .MuiDataGrid-row': { bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } },
            '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
            color: 'text.primary',
          }}
        />
      </Box>
      <MatchDetailModal open={detailOpen} onClose={handleCloseDetail} match={selectedMatch} />
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

export default MatchHistoryTable; 