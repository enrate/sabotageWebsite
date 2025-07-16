import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Avatar,
  Divider,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Switch,
  FormControlLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  OpenInNew as OpenInNewIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ModeratorIcon,
  PersonAdd as UserIcon
} from '@mui/icons-material';

const AdminUsers = ({ users, setUsers }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [banDialog, setBanDialog] = useState({ open: false, userId: null });
  const [banReason, setBanReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [warningDialog, setWarningDialog] = useState({ open: false, userId: null });
  const [warningReason, setWarningReason] = useState('');
  const [warningDescription, setWarningDescription] = useState('');
  const [warningLoading, setWarningLoading] = useState(false);
  const [warningError, setWarningError] = useState(null);
  const [warningSuccess, setWarningSuccess] = useState(null);
  const [warningsDialog, setWarningsDialog] = useState({ open: false, userId: null, username: '' });
  const [userWarnings, setUserWarnings] = useState([]);
  const [warningsLoading, setWarningsLoading] = useState(false);
  const [warningsError, setWarningsError] = useState(null);
  const [showAllWarnings, setShowAllWarnings] = useState(false);

  // Фильтрация пользователей по поисковому запросу
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.description && user.description.toLowerCase().includes(query)) ||
      user.role.toLowerCase().includes(query)
    );
  });

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const token = localStorage.getItem('token');
    try {
      // Обновление пользователя
      const res = await axios.patch(`/api/admin/users/${editingId}`, { 
        username, 
        email,
        role,
        description
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setUsers(users.map(user => user.id === editingId ? res.data : user));
      setEditingId(null);
      setSuccess('Пользователь успешно обновлен');
      setUsername('');
      setEmail('');
      setRole('');
      setDescription('');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при обновлении пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setUsername(user.username);
    setEmail(user.email || '');
    setRole(user.role);
    setDescription(user.description || '');
    setEditingId(user.id);
  };

  const handleCancelEdit = () => {
    setUsername('');
    setEmail('');
    setRole('');
    setDescription('');
    setEditingId(null);
  };

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/api/admin/users/${deleteDialog.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setUsers(users.filter(user => user.id !== deleteDialog.id));
      setSuccess('Пользователь успешно удален');
      setDeleteDialog({ open: false, id: null });
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при удалении пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async () => {
    if (!banReason.trim()) {
      setError('Укажите причину блокировки');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/users/${banDialog.userId}/ban`, {
        reason: banReason
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      // Обновляем статус пользователя в списке
      setUsers(users.map(user => 
        user.id === banDialog.userId 
          ? { ...user, isBanned: true, banReason: banReason }
          : user
      ));
      
      setBanDialog({ open: false, userId: null });
      setBanReason('');
      setSuccess('Пользователь заблокирован');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка блокировки пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/users/${userId}/unban`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      // Обновляем статус пользователя в списке
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, isBanned: false, banReason: null }
          : user
      ));
      
      setSuccess('Пользователь разблокирован');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка разблокировки пользователя');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return '#f44336';
      case 'moderator':
        return '#ff9800';
      default:
        return '#4f8cff';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminIcon />;
      case 'moderator':
        return <ModeratorIcon />;
      default:
        return <UserIcon />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'moderator':
        return 'Модератор';
      default:
        return 'Пользователь';
    }
  };

  // Функция для выдачи предупреждения
  const handleIssueWarning = async () => {
    if (!warningReason.trim()) {
      setWarningError('Укажите причину предупреждения');
      return;
    }
    setWarningLoading(true);
    setWarningError(null);
    setWarningSuccess(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/users/${warningDialog.userId}/warnings`, {
        reason: warningReason,
        description: warningDescription.slice(0, 150)
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setWarningReason('');
      setWarningDescription('');
      setWarningSuccess('Предупреждение выдано');
      setTimeout(() => setWarningSuccess(null), 2000);
    } catch (err) {
      setWarningError(err.response?.data?.message || 'Ошибка выдачи предупреждения');
    } finally {
      setWarningLoading(false);
    }
  };

  // Функция для загрузки предупреждений пользователя
  const loadUserWarnings = async (userId, all = false) => {
    setWarningsLoading(true);
    setWarningsError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/admin/users/${userId}/warnings?all=${all ? 1 : 0}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setUserWarnings(res.data || []);
    } catch (err) {
      setWarningsError('Ошибка загрузки предупреждений');
    } finally {
      setWarningsLoading(false);
    }
  };

  // Функция для снятия предупреждения
  const handleCancelWarning = async (warningId) => {
    setWarningsLoading(true);
    setWarningsError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/admin/user-warnings/${warningId}/cancel`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setUserWarnings(warnings => warnings.filter(w => w.id !== warningId));
    } catch (err) {
      setWarningsError('Ошибка снятия предупреждения');
    } finally {
      setWarningsLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ color: '#ffb347', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon />
        Управление игроками
      </Typography>

      {/* Поиск */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Поиск по имени, email, описанию или роли..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(255, 179, 71, 0.3)',
              },
              '&:hover fieldset': {
                borderColor: '#ffb347',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#ffb347',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
            '& .MuiInputBase-input': {
              color: '#fff',
            },
          }}
        />
      </Box>

      {/* Ошибки и успех */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Форма редактирования */}
      {editingId && (
        <Card sx={{ mb: 4, bgcolor: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 179, 71, 0.2)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#ffb347', mb: 2 }}>
              Редактирование пользователя
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 179, 71, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: '#ffb347',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ffb347',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputBase-input': {
                    color: '#fff',
                  },
                }}
              />
              <TextField
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 179, 71, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: '#ffb347',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ffb347',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputBase-input': {
                    color: '#fff',
                  },
                }}
              />
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Роль</InputLabel>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  sx={{
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 179, 71, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ffb347',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ffb347',
                    },
                  }}
                >
                  <MenuItem value="user">Пользователь</MenuItem>
                  <MenuItem value="moderator">Модератор</MenuItem>
                  <MenuItem value="admin">Администратор</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Описание"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 179, 71, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: '#ffb347',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ffb347',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputBase-input': {
                    color: '#fff',
                  },
                }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? null : <SaveIcon />}
                  sx={{
                    bgcolor: '#4caf50',
                    '&:hover': {
                      bgcolor: '#45a049'
                    }
                  }}
                >
                  {loading ? 'Сохранение...' : 'Обновить'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  startIcon={<CancelIcon />}
                  sx={{
                    borderColor: 'rgba(255, 179, 71, 0.5)',
                    color: '#ffb347',
                    '&:hover': {
                      borderColor: '#ffb347',
                      bgcolor: 'rgba(255, 179, 71, 0.1)'
                    }
                  }}
                >
                  Отмена
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Список пользователей */}
      <Box sx={{ mt: 3 }}>
        <Table sx={{ minWidth: 900, background: 'rgba(0,0,0,0.15)', borderRadius: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#ffb347', fontWeight: 700 }}>Аватар</TableCell>
              <TableCell sx={{ color: '#ffb347', fontWeight: 700 }}>Имя</TableCell>
              <TableCell sx={{ color: '#ffb347', fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ color: '#ffb347', fontWeight: 700 }}>Роль</TableCell>
              <TableCell sx={{ color: '#ffb347', fontWeight: 700 }}>Статус</TableCell>
              <TableCell sx={{ color: '#ffb347', fontWeight: 700 }}>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.id} sx={{ opacity: user.isBanned ? 0.7 : 1 }}>
                <TableCell>
                  <Avatar src={user.avatar} sx={{ width: 40, height: 40, bgcolor: user.avatar ? 'transparent' : '#ffb347' }}>
                    {!user.avatar && <PersonIcon />}
                  </Avatar>
                </TableCell>
                <TableCell>
                  <Typography 
                    sx={{ color: '#ffb347', fontWeight: 600, cursor: 'pointer', '&:hover': { color: '#ffd700', textDecoration: 'underline' } }}
                    onClick={() => handleUserClick(user.id)}
                  >
                    {user.username}
                  </Typography>
                </TableCell>
                <TableCell sx={{ color: '#fff' }}>{user.email || '—'}</TableCell>
                <TableCell>
                  <Chip
                    icon={getRoleIcon(user.role)}
                    label={getRoleLabel(user.role)}
                    size="small"
                    sx={{ bgcolor: getRoleColor(user.role), color: '#fff', fontSize: '0.75rem' }}
                  />
                </TableCell>
                <TableCell>
                  {user.isBanned ? (
                    <Chip icon={<BlockIcon />} label="Заблокирован" size="small" sx={{ bgcolor: '#f44336', color: '#fff', fontSize: '0.75rem' }} />
                  ) : (
                    <Chip label="Активен" size="small" sx={{ bgcolor: '#4caf50', color: '#fff', fontSize: '0.75rem' }} />
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {user.isBanned ? (
                      <Button size="small" onClick={() => handleUnban(user.id)} startIcon={<CheckCircleIcon />} sx={{ color: '#4caf50', '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.1)' } }}>Разблокировать</Button>
                    ) : (
                      <Button size="small" onClick={() => { setBanDialog({ open: true, userId: user.id }); }} startIcon={<BlockIcon />} sx={{ color: '#f44336', '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.1)' } }}>Заблокировать</Button>
                    )}
                    <Button size="small" onClick={() => { setWarningsDialog({ open: true, userId: user.id, username: user.username }); setShowAllWarnings(false); loadUserWarnings(user.id, false); }} startIcon={<WarningIcon />} sx={{ color: '#ff9800', '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.1)' } }}>Предупреждения</Button>
                    <Button size="small" onClick={() => setWarningDialog({ open: true, userId: user.id })} startIcon={<WarningIcon />} sx={{ color: '#ffb347', '&:hover': { bgcolor: 'rgba(255, 179, 71, 0.1)' } }}>Выдать предупреждение</Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Диалог подтверждения удаления */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>
            Отмена
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог блокировки пользователя */}
      <Dialog open={banDialog.open} onClose={() => setBanDialog({ open: false, userId: null })}>
        <DialogTitle>Блокировка пользователя</DialogTitle>
        <DialogContent>
          <TextField
            label="Причина блокировки"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            multiline
            rows={3}
            fullWidth
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 179, 71, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: '#ffb347',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ffb347',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiInputBase-input': {
                color: '#fff',
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBanDialog({ open: false, userId: null })}>
            Отмена
          </Button>
          <Button onClick={handleBan} variant="contained" color="error">
            Заблокировать
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог выдачи предупреждения */}
      <Dialog open={warningDialog.open} onClose={() => setWarningDialog({ open: false, userId: null })}>
        <DialogTitle>Выдать предупреждение</DialogTitle>
        <DialogContent>
          <TextField
            label="Причина предупреждения"
            value={warningReason}
            onChange={(e) => setWarningReason(e.target.value)}
            required
            fullWidth
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            label="Описание (необязательно)"
            value={warningDescription}
            onChange={e => setWarningDescription(e.target.value.slice(0, 150))}
            multiline
            rows={3}
            fullWidth
            inputProps={{ maxLength: 150 }}
            helperText={`${warningDescription.length}/150 символов`}
          />
          {warningError && <Alert severity="error" sx={{ mt: 2 }}>{warningError}</Alert>}
          {warningSuccess && <Alert severity="success" sx={{ mt: 2 }}>{warningSuccess}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWarningDialog({ open: false, userId: null })}>Отмена</Button>
          <Button onClick={handleIssueWarning} variant="contained" color="warning" disabled={warningLoading}>
            {warningLoading ? 'Отправка...' : 'Выдать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог просмотра и снятия предупреждений */}
      <Dialog open={warningsDialog.open} onClose={() => setWarningsDialog({ open: false, userId: null, username: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Предупреждения пользователя {warningsDialog.username}</DialogTitle>
        <DialogContent>
          <FormControlLabel
            control={<Switch checked={showAllWarnings} onChange={e => { setShowAllWarnings(e.target.checked); loadUserWarnings(warningsDialog.userId, e.target.checked); }} color="primary" />}
            label="Показать все"
            sx={{ mb: 2 }}
          />
          {warningsLoading ? <Typography>Загрузка...</Typography> :
            userWarnings.length === 0 ? <Typography>Нет активных предупреждений</Typography> :
            <List>
              {userWarnings.map(w => (
                <ListItem key={w.id} alignItems="flex-start" secondaryAction={
                  w.isActive ? (
                    <Button size="small" color="error" onClick={() => handleCancelWarning(w.id)} disabled={warningsLoading}>
                      Снять
                    </Button>
                  ) : null
                }>
                  <ListItemText
                    primary={w.reason + (!w.isActive ? ' (снято)' : '')}
                    secondary={
                      <>
                        {w.description && <span style={{wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-line', display: 'block'}}>{w.description}<br /></span>}
                        <span style={{ color: '#888', fontSize: 13 }}>
                          Выдано: {w.admin?.username || '—'} | {new Date(w.createdAt).toLocaleString()}
                          {!w.isActive && w.canceledByAdmin && (
                            <><br />Снято: {w.canceledByAdmin.username} | {w.canceledAt ? new Date(w.canceledAt).toLocaleString() : ''}</>)
                          }
                        </span>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          }
          {warningsError && <Alert severity="error" sx={{ mt: 2 }}>{warningsError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWarningsDialog({ open: false, userId: null, username: '' })}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsers; 