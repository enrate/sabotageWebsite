import React, { useState } from 'react';
import {
  Box, Typography, Tooltip, IconButton, Snackbar, Alert, Dialog
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Visibility as VisibilityIcon, ListAlt as LogIcon } from '@mui/icons-material';
import LogDetailModal from './LogDetailModal';

const columns = (handleDetail) => [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'type', headerName: 'Тип', width: 120 },
  {
    field: 'user',
    headerName: 'Пользователь',
    width: 180,
    valueGetter: (params) => params.value?.username || '-'
  },
  {
    field: 'createdAt',
    headerName: 'Дата',
    width: 180,
    valueGetter: (params) => params.value ? new Date(params.value).toLocaleString('ru-RU') : '-'
  },
  {
    field: 'message',
    headerName: 'Сообщение',
    flex: 2,
    minWidth: 200,
    valueGetter: (params) => params.value?.slice(0, 60) + '...'
  },
  {
    field: 'actions',
    headerName: '',
    width: 100,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Просмотр">
          <IconButton size="small" color="primary" onClick={() => handleDetail(params.row)}><VisibilityIcon /></IconButton>
        </Tooltip>
      </Box>
    ),
  },
];

const LogsTable = ({ logs }) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleOpenDetail = (log) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };
  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedLog(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <LogIcon /> Системные логи
        </Typography>
      </Box>
      <Box sx={{ height: 540, width: '100%', bgcolor: 'background.paper', borderRadius: 3, boxShadow: 2 }}>
        <DataGrid
          rows={logs}
          columns={columns(handleOpenDetail)}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          autoHeight={false}
          getRowId={row => row.id || row.logId}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default', color: 'text.secondary', fontWeight: 700 },
            '& .MuiDataGrid-row': { bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } },
            '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
            color: 'text.primary',
          }}
        />
      </Box>
      <LogDetailModal open={detailOpen} onClose={handleCloseDetail} log={selectedLog} />
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LogsTable; 