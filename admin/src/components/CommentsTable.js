import React, { useState } from 'react';
import {
  Box, Typography, Avatar, Tooltip, IconButton, Snackbar, Alert, Dialog
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Visibility as VisibilityIcon, Delete as DeleteIcon, Person as PersonIcon, Block as BlockIcon } from '@mui/icons-material';
import CommentDetailModal from './CommentDetailModal';

const columns = (handleDetail, handleDelete, handleBan) => [
  { field: 'id', headerName: 'ID', width: 80 },
  {
    field: 'author',
    headerName: 'Автор',
    width: 180,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar src={params.value?.avatar} sx={{ width: 28, height: 28 }}>{params.value?.username?.[0]}</Avatar>
        {params.value?.username}
      </Box>
    )
  },
  {
    field: 'text',
    headerName: 'Текст',
    flex: 2,
    minWidth: 200,
    valueGetter: (params) => params.value?.slice(0, 60) + '...'
  },
  {
    field: 'targetType',
    headerName: 'Объект',
    width: 140,
    valueGetter: (params) => params.row.targetType + ' #' + params.row.targetId
  },
  {
    field: 'actions',
    headerName: '',
    width: 140,
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
        <Tooltip title="Бан автора (в разработке)">
          <IconButton size="small" color="warning" onClick={() => handleBan(params.row)}><BlockIcon /></IconButton>
        </Tooltip>
      </Box>
    ),
  },
];

const CommentsTable = ({ comments, refreshComments }) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleOpenDetail = (comment) => {
    setSelectedComment(comment);
    setDetailOpen(true);
  };
  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedComment(null);
  };
  const handleDelete = (id) => {
    setDeleteId(id);
    // TODO: реализовать удаление
    setSnackbar({ open: true, message: 'Комментарий удалён (заглушка)', severity: 'info' });
  };
  const handleBan = (comment) => {
    setSnackbar({ open: true, message: 'Бан автора в разработке', severity: 'info' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon /> Комментарии
        </Typography>
      </Box>
      <Box sx={{ height: 540, width: '100%', bgcolor: 'background.paper', borderRadius: 3, boxShadow: 2 }}>
        <DataGrid
          rows={comments}
          columns={columns(handleOpenDetail, handleDelete, handleBan)}
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
      <CommentDetailModal open={detailOpen} onClose={handleCloseDetail} comment={selectedComment} />
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

export default CommentsTable; 