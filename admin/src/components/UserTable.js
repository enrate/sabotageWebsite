import React, { useState } from 'react';
import {
  Box, Typography, Button, Avatar, Tooltip, IconButton, Snackbar, Alert, Dialog, TextField, CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon, Person as PersonIcon, Block as BlockIcon, Add as AddIcon, Warning as WarningIcon } from '@mui/icons-material';
import UserEditorModal from './UserEditorModal';
import axios from 'axios';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const columns = (handleEdit, handleBan, handleUnban, handleWarnings) => [
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
  { field: 'createdAt', headerName: 'Дата регистрации', flex: 1, minWidth: 160},
  {
    field: 'actions',
    headerName: '',
    width: 180,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Редактировать">
          <IconButton size="small" color="primary" onClick={() => handleEdit(params.row)}><EditIcon /></IconButton>
        </Tooltip>
        <Tooltip title="Предупреждения">
          <IconButton size="small" color="warning" onClick={() => handleWarnings(params.row)}><WarningIcon /></IconButton>
        </Tooltip>
        {params.row.isBanned ? (
          <Tooltip title="Разбанить">
            <IconButton size="small" color="success" onClick={() => handleUnban(params.row)}><BlockIcon /></IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Забанить">
            <IconButton size="small" color="warning" onClick={() => handleBan(params.row)}><BlockIcon /></IconButton>
          </Tooltip>
        )}
      </Box>
    ),
  },
];

const UserTable = ({ users, refreshUsers }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [banUser, setBanUser] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [warningsUser, setWarningsUser] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [showAllWarnings, setShowAllWarnings] = useState(false);
  const [loadingWarnings, setLoadingWarnings] = useState(false);
  const [newWarning, setNewWarning] = useState({ reason: '', description: '' });
  const [savingWarning, setSavingWarning] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

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

  // --- БАН ---
  const handleBan = (user) => {
    setBanUser(user);
    setBanReason('');
  };
  const handleBanConfirm = async () => {
    if (!banUser || !banReason) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      await axios.post(`/api/admin/users/${banUser.id}/ban`, { reason: banReason }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSnackbar({ open: true, message: 'Пользователь забанен', severity: 'success' });
      setBanUser(null);
      setBanReason('');
      refreshUsers();
    } catch (err) {
      setSnackbar({ open: true, message: 'Ошибка при бане', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async (user) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      await axios.post(`/api/admin/users/${user.id}/unban`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSnackbar({ open: true, message: 'Пользователь разбанен', severity: 'success' });
      refreshUsers();
    } catch (err) {
      setSnackbar({ open: true, message: 'Ошибка при разбане', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleWarnings = async (user) => {
    setWarningsUser(user);
    setShowAllWarnings(false);
    setLoadingWarnings(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await axios.get(`/api/admin/users/${user.id}/warnings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { all: false }
      });
      setWarnings(res.data);
    } catch (err) {
      setWarnings([]);
    } finally {
      setLoadingWarnings(false);
    }
  };
  const fetchWarnings = async (all = false) => {
    if (!warningsUser) return;
    setLoadingWarnings(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await axios.get(`/api/admin/users/${warningsUser.id}/warnings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { all }
      });
      setWarnings(res.data);
    } catch (err) {
      setWarnings([]);
    } finally {
      setLoadingWarnings(false);
    }
  };
  const handleShowAllWarnings = () => {
    setShowAllWarnings((prev) => !prev);
    fetchWarnings(!showAllWarnings);
  };
  const handleIssueWarning = async () => {
    if (!warningsUser || !newWarning.reason) return;
    setSavingWarning(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      await axios.post(`/api/admin/users/${warningsUser.id}/warnings`, newWarning, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSnackbar({ open: true, message: 'Предупреждение выдано', severity: 'success' });
      setNewWarning({ reason: '', description: '' });
      fetchWarnings(showAllWarnings);
    } catch (err) {
      setSnackbar({ open: true, message: 'Ошибка при выдаче предупреждения', severity: 'error' });
    } finally {
      setSavingWarning(false);
    }
  };
  const handleCancelWarning = async (warningId) => {
    setSavingWarning(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      await axios.patch(`/api/admin/user-warnings/${warningId}/cancel`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSnackbar({ open: true, message: 'Предупреждение снято', severity: 'success' });
      fetchWarnings(showAllWarnings);
    } catch (err) {
      setSnackbar({ open: true, message: 'Ошибка при снятии предупреждения', severity: 'error' });
    } finally {
      setSavingWarning(false);
    }
  };

  // Фильтрация пользователей
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && new Date(u.createdAt) >= dateFrom;
    }
    if (dateTo) {
      matchesDate = matchesDate && new Date(u.createdAt) <= dateTo;
    }
    return matchesSearch && matchesDate;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon /> Пользователи
        </Typography>
        <TextField
          label="Поиск по имени или email"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ ml: 2, minWidth: 220 }}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Дата регистрации от"
            value={dateFrom}
            onChange={setDateFrom}
            slotProps={{ textField: { size: 'small', sx: { minWidth: 160, ml: 2 } } }}
          />
          <DatePicker
            label="Дата регистрации до"
            value={dateTo}
            onChange={setDateTo}
            slotProps={{ textField: { size: 'small', sx: { minWidth: 160, ml: 2 } } }}
          />
        </LocalizationProvider>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ ml: 'auto' }}>
          Создать
        </Button>
      </Box>
      <Box sx={{ height: 540, width: '100%', bgcolor: 'background.paper', borderRadius: 3, boxShadow: 2 }}>
        <DataGrid
          rows={filteredUsers}
          columns={columns(handleOpenModal, handleBan, handleUnban, handleWarnings)}
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
      {/* Диалог бана */}
      <Dialog open={!!banUser} onClose={() => setBanUser(null)}>
        <Box sx={{ p: 3, minWidth: 350 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Забанить пользователя</Typography>
          <Typography sx={{ mb: 2 }}>Укажите причину блокировки для <b>{banUser?.username}</b>:</Typography>
          <TextField
            fullWidth
            label="Причина блокировки"
            value={banReason}
            onChange={e => setBanReason(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
            <Button onClick={() => setBanUser(null)} disabled={loading}>Отмена</Button>
            <Button color="error" variant="contained" onClick={handleBanConfirm} disabled={!banReason || loading}>Забанить</Button>
          </Box>
        </Box>
      </Dialog>
      {/* Диалог предупреждений */}
      <Dialog open={!!warningsUser} onClose={() => setWarningsUser(null)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Предупреждения для {warningsUser?.username}</Typography>
          <Button size="small" onClick={handleShowAllWarnings} sx={{ mb: 2 }}>
            {showAllWarnings ? 'Показать только активные' : 'Показать все'}
          </Button>
          {loadingWarnings ? <CircularProgress size={24} /> : (
            warnings.length === 0 ? <Alert severity="info">Нет предупреждений</Alert> :
              warnings.map(w => (
                <Box key={w.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2, bgcolor: w.isActive ? 'warning.light' : 'grey.100' }}>
                  <Typography variant="subtitle2">Причина: {w.reason}</Typography>
                  {w.description && <Typography variant="body2">{w.description}</Typography>}
                  <Typography variant="caption" color="text.secondary">Выдано: {new Date(w.createdAt).toLocaleString('ru-RU')} админом {w.admin?.username}</Typography>
                  {!w.isActive && w.canceledByAdmin && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Снято: {new Date(w.canceledAt).toLocaleString('ru-RU')} админом {w.canceledByAdmin?.username}</Typography>
                  )}
                  {w.isActive && (
                    <Button size="small" color="error" onClick={() => handleCancelWarning(w.id)} disabled={savingWarning} sx={{ mt: 1 }}>Снять предупреждение</Button>
                  )}
                </Box>
              ))
          )}
          <Box sx={{ mt: 3, borderTop: '1px solid #eee', pt: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Выдать новое предупреждение</Typography>
            <TextField
              label="Причина"
              value={newWarning.reason}
              onChange={e => setNewWarning(w => ({ ...w, reason: e.target.value }))}
              fullWidth
              sx={{ mb: 1 }}
              disabled={savingWarning}
            />
            <TextField
              label="Описание (необязательно)"
              value={newWarning.description}
              onChange={e => setNewWarning(w => ({ ...w, description: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
              sx={{ mb: 2 }}
              disabled={savingWarning}
            />
            <Button variant="contained" color="warning" onClick={handleIssueWarning} disabled={savingWarning || !newWarning.reason}>
              {savingWarning ? 'Сохранение...' : 'Выдать предупреждение'}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default UserTable; 