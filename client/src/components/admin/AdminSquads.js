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
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Search as SearchIcon,
  OpenInNew as OpenInNewIcon,
  Tag as TagIcon
} from '@mui/icons-material';

const AdminSquads = ({ squads, setSquads }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [warningDialog, setWarningDialog] = useState({ open: false, squadId: null });
  const [warningReason, setWarningReason] = useState('');
  const [warningDescription, setWarningDescription] = useState('');
  const [warnings, setWarnings] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Фильтрация отрядов по поисковому запросу
  const filteredSquads = squads.filter(squad => {
    const query = searchQuery.toLowerCase();
    return (
      squad.name.toLowerCase().includes(query) ||
      (squad.tag && squad.tag.toLowerCase().includes(query)) ||
      (squad.description && squad.description.toLowerCase().includes(query))
    );
  });

  const handleSquadClick = (squadId) => {
    navigate(`/squads/${squadId}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const token = localStorage.getItem('token');
    try {
      // Обновление отряда
      const res = await axios.patch(`/api/squads/${editingId}`, { 
        name, 
        description,
        tag
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSquads(squads.map(squad => squad.id === editingId ? res.data : squad));
      setEditingId(null);
      setSuccess('Отряд успешно обновлен');
      setName('');
      setDescription('');
      setTag('');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при обновлении отряда');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (squad) => {
    setName(squad.name);
    setDescription(squad.description || '');
    setTag(squad.tag || '');
    setEditingId(squad.id);
  };

  const handleCancelEdit = () => {
    setName('');
    setDescription('');
    setTag('');
    setEditingId(null);
  };

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/api/squads/${deleteDialog.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSquads(squads.filter(squad => squad.id !== deleteDialog.id));
      setSuccess('Отряд успешно удален');
      setDeleteDialog({ open: false, id: null });
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при удалении отряда');
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

  // Функция для загрузки предупреждений отряда
  const loadSquadWarnings = async (squadId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin/squads/${squadId}/warnings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setWarnings(prev => ({ ...prev, [squadId]: response.data }));
    } catch (err) {
      console.error('Ошибка загрузки предупреждений:', err);
    }
  };

  // Функция для выдачи предупреждения
  const handleIssueWarning = async () => {
    if (!warningReason.trim()) {
      setError('Укажите причину предупреждения');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/squads/${warningDialog.squadId}/warnings`, {
        reason: warningReason,
        description: warningDescription.slice(0, 150)
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      // Перезагружаем предупреждения
      await loadSquadWarnings(warningDialog.squadId);
      
      setWarningDialog({ open: false, squadId: null });
      setWarningReason('');
      setWarningDescription('');
      setSuccess('Предупреждение выдано');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка выдачи предупреждения');
    } finally {
      setLoading(false);
    }
  };

  // Функция для отмены предупреждения
  const handleCancelWarning = async (warningId) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/admin/warnings/${warningId}/cancel`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      // Обновляем список предупреждений
      setWarnings(prev => {
        const newWarnings = { ...prev };
        Object.keys(newWarnings).forEach(squadId => {
          newWarnings[squadId] = newWarnings[squadId].filter(w => w.id !== warningId);
        });
        return newWarnings;
      });
      
      setSuccess('Предупреждение отменено');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка отмены предупреждения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ color: '#ffb347', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <GroupIcon />
        Управление отрядами
      </Typography>

      {/* Поиск */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Поиск по названию, тегу или описанию отряда..."
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
              Редактирование отряда
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Название отряда"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                label="Описание отряда"
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
              <TextField
                label="Тег отряда"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
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

      {/* Список отрядов */}
      <Grid container spacing={3}>
        {filteredSquads.map(squad => (
          <Grid item xs={12} md={6} lg={4} key={squad.id}>
            <Card sx={{ 
              bgcolor: 'rgba(0, 0, 0, 0.2)', 
              border: '1px solid rgba(255, 179, 71, 0.2)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar
                    src={squad.logo}
                    sx={{ 
                      width: 48, 
                      height: 48, 
                      border: '2px solid #ffb347',
                      bgcolor: squad.logo ? 'transparent' : '#ffb347'
                    }}
                  >
                    {!squad.logo && <GroupIcon />}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#ffb347',
                        cursor: 'pointer',
                        '&:hover': {
                          color: '#ffd700',
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={() => handleSquadClick(squad.id)}
                    >
                      {squad.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {squad.description || 'Нет описания'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 16, color: '#4f8cff' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      Лидер: {squad.leader?.username || 'Неизвестно'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon sx={{ fontSize: 16, color: '#4f8cff' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      Участников: {squad.members?.length || 0}
                    </Typography>
                  </Box>
                  {squad.createdAt && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SecurityIcon sx={{ fontSize: 16, color: '#4f8cff' }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        Создан: {formatDate(squad.createdAt)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    label={squad.isJoinRequestOpen ? 'Набор открыт' : 'Набор закрыт'} 
                    size="small"
                    color={squad.isJoinRequestOpen ? "success" : "error"}
                    sx={{ fontSize: '0.75rem' }}
                  />
                  {squad.tag && (
                    <Chip 
                      icon={<TagIcon />}
                      label={squad.tag}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(156, 39, 176, 0.1)',
                        color: '#9c27b0',
                        fontSize: '0.75rem'
                      }}
                    />
                  )}
                  {squad.performance && squad.performance.length > 0 && (
                    <Chip 
                      label={`S${squad.performance[0].season}`}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 179, 71, 0.1)',
                        color: '#ffb347',
                        fontSize: '0.75rem'
                      }}
                    />
                  )}
                  {warnings[squad.id] && warnings[squad.id].length > 0 && (
                    <Chip 
                      label={`${warnings[squad.id].length} предупреждений`}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(244, 67, 54, 0.1)',
                        color: '#f44336',
                        fontSize: '0.75rem'
                      }}
                    />
                  )}
                </Box>
              </CardContent>
              <Divider sx={{ borderColor: 'rgba(255, 179, 71, 0.2)' }} />
              <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => handleSquadClick(squad.id)}
                    startIcon={<OpenInNewIcon />}
                    sx={{
                      color: '#4caf50',
                      '&:hover': {
                        bgcolor: 'rgba(76, 175, 80, 0.1)'
                      }
                    }}
                  >
                    Перейти
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleEdit(squad)}
                    startIcon={<EditIcon />}
                    sx={{
                      color: '#4f8cff',
                      '&:hover': {
                        bgcolor: 'rgba(79, 140, 255, 0.1)'
                      }
                    }}
                  >
                    Редактировать
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setWarningDialog({ open: true, squadId: squad.id });
                      loadSquadWarnings(squad.id);
                    }}
                    startIcon={<WarningIcon />}
                    sx={{
                      color: '#f44336',
                      '&:hover': {
                        bgcolor: 'rgba(244, 67, 54, 0.1)'
                      }
                    }}
                  >
                    Предупреждение
                  </Button>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setDeleteDialog({ open: true, id: squad.id })}
                  sx={{
                    color: '#f44336',
                    '&:hover': {
                      bgcolor: 'rgba(244, 67, 54, 0.1)'
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Диалог подтверждения удаления */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить этот отряд? Это действие нельзя отменить.
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

      {/* Диалог выдачи предупреждения */}
      <Dialog 
        open={warningDialog.open} 
        onClose={() => setWarningDialog({ open: false, squadId: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#ffb347', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon />
          Выдать предупреждение отряду
        </DialogTitle>
        <DialogContent>
          {/* Список существующих предупреждений */}
          {warnings[warningDialog.squadId] && warnings[warningDialog.squadId].length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#f44336', mb: 2 }}>
                Активные предупреждения:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {warnings[warningDialog.squadId].map((warning) => (
                  <Card key={warning.id} sx={{ 
                    bgcolor: 'rgba(244, 67, 54, 0.1)', 
                    border: '1px solid rgba(244, 67, 54, 0.3)',
                    p: 2
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: '#f44336', fontWeight: 600 }}>
                        {warning.reason}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => handleCancelWarning(warning.id)}
                        disabled={loading}
                        sx={{ color: '#f44336', minWidth: 'auto', p: 0.5 }}
                      >
                        Отменить
                      </Button>
                    </Box>
                    {warning.description && (
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                        {warning.description}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Выдано: {formatDate(warning.createdAt)} администратором {warning.admin?.username}
                    </Typography>
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Причина предупреждения"
              value={warningReason}
              onChange={(e) => setWarningReason(e.target.value)}
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
              label="Описание (необязательно)"
              value={warningDescription}
              onChange={e => setWarningDescription(e.target.value.slice(0, 150))}
              multiline
              rows={3}
              fullWidth
              inputProps={{ maxLength: 150 }}
              helperText={`${warningDescription.length}/150 символов`}
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
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setWarningDialog({ open: false, squadId: null })}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleIssueWarning} 
            variant="contained"
            disabled={loading}
            startIcon={loading ? null : <WarningIcon />}
            sx={{
              bgcolor: '#f44336',
              '&:hover': {
                bgcolor: '#d32f2f'
              }
            }}
          >
            {loading ? 'Выдача...' : 'Выдать предупреждение'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSquads;