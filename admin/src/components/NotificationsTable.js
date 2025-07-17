import React, { useState } from 'react';
import {
  Box, Typography, Avatar, Tooltip, IconButton, Snackbar, Alert, Dialog
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Visibility as VisibilityIcon, Delete as DeleteIcon, MarkEmailRead as ReadIcon, Notifications as NotificationsIcon } from '@mui/icons-material';
import NotificationDetailModal from './NotificationDetailModal';

const columns = (handleDetail, handleDelete, handleMarkRead) => [
  { field: 'id', headerName: 'ID', width: 80 },
  {
    field: 'recipient',
    headerName: 'Получатель',
    width: 180,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar src={params.value?.avatar} sx={{ width: 28, height: 28 }}>{params.value?.username?.[0]}</Avatar>
        {params.value?.username}
      </Box>
    )
  },
  { field: 'type', headerName: 'Тип', width: 120 },
  {
    field: 'message',
    headerName: 'Текст',
    flex: 2,
    minWidth: 200,
    valueGetter: (params) => params.value?.slice(0, 60) + '...'
  },
  {
    field: 'read',
    headerName: 'Статус',
    width: 120,
    renderCell: (params) => params.value ? 'Прочитано' : 'Непрочитано'
  },
  {
    field: 'actions',
    headerName: '',
    width: 160,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Просмотр/редактировать">
          <IconButton size="small" color="primary" onClick={() => handleDetail(params.row)}><VisibilityIcon /></IconButton>
        </Tooltip>
        <Tooltip title="Удалить">
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}><DeleteIcon /></IconButton>
        </Tooltip>
        {!params.row.read && (
          <Tooltip title="Отметить как прочитанное">
            <IconButton size="small" color="success" onClick={() => handleMarkRead(params.row.id)}><ReadIcon /></IconButton>
          </Tooltip>
        )}
      </Box>
    ),
  },
];

const NotificationsTable = ({ notifications, refreshNotifications }) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleOpenDetail = (notification) => {
    setSelectedNotification(notification);
    setDetailOpen(true);
  };
  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedNotification(null);
  };
  const handleDelete = (id) => {
    setDeleteId(id);
    // TODO: реализовать удаление
    setSnackbar({ open: true, message: 'Уведомление удалено (заглушка)', severity: 'info' });
  };
  const handleMarkRead = (id) => {
    // TODO: реализовать отметку как прочитанное
    setSnackbar({ open: true, message: 'Отмечено как прочитанное (заглушка)', severity: 'info' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon /> Уведомления
        </Typography>
      </Box>
      <Box sx={{ height: 540, width: '100%', bgcolor: 'background.paper', borderRadius: 3, boxShadow: 2 }}>
        <DataGrid
          rows={notifications}
          columns={columns(handleOpenDetail, handleDelete, handleMarkRead)}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          autoHeight={false}
          getRowId={row => row.id || row.notificationId}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default', color: 'text.secondary', fontWeight: 700 },
            '& .MuiDataGrid-row': { bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } },
            '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
            color: 'text.primary',
          }}
        />
      </Box>
      <NotificationDetailModal open={detailOpen} onClose={handleCloseDetail} notification={selectedNotification} />
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

export default NotificationsTable; 