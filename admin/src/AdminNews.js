import React, { useState } from 'react';
import axios from 'axios';
import { useAdminAuth } from './context/AdminAuthContext';
import RichTextEditor from './RichTextEditor';
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
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Article as NewsIcon
} from '@mui/icons-material';

const AdminNews = ({ news, setNews }) => {
  const { currentUser } = useAdminAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const token = localStorage.getItem('token');
    try {
      if (editingId) {
        // Редактирование новости
        const res = await axios.patch(`/api/news/${editingId}`, { title, content }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setNews(news.map(item => item.id === editingId ? res.data : item));
        setEditingId(null);
        setSuccess('Новость успешно обновлена');
      } else {
        // Создание новой новости
        const res = await axios.post('/api/news', { title, content }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setNews([res.data, ...news]);
        setSuccess('Новость успешно добавлена');
      }
      setTitle('');
      setContent('');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при сохранении новости');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setTitle(item.title);
    setContent(item.content);
    setEditingId(item.id);
  };

  const handleCancelEdit = () => {
    setTitle('');
    setContent('');
    setEditingId(null);
  };

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/api/news/${deleteDialog.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setNews(news.filter(item => item.id !== deleteDialog.id));
      setSuccess('Новость успешно удалена');
      setDeleteDialog({ open: false, id: null });
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при удалении новости');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ color: '#ffb347', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <NewsIcon />
        Управление новостями
      </Typography>
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
      {/* Форма добавления/редактирования */}
      <Card sx={{ mb: 4, bgcolor: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 179, 71, 0.2)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#ffb347', mb: 2 }}>
            {editingId ? 'Редактирование новости' : 'Добавить новость'}
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Заголовок"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
            <Typography variant="subtitle1" sx={{ color: '#ffb347', mb: 1 }}>
              Содержание:
            </Typography>
            <RichTextEditor
              value={content}
              onChange={(newContent) => setContent(newContent)}
              placeholder="Введите содержание новости..."
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? null : (editingId ? <SaveIcon /> : <AddIcon />)}
                sx={{
                  bgcolor: '#4caf50',
                  '&:hover': {
                    bgcolor: '#45a049'
                  }
                }}
              >
                {loading ? 'Сохранение...' : (editingId ? 'Обновить' : 'Добавить')}
              </Button>
              {editingId && (
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
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
      {/* Список новостей */}
      <Grid container spacing={3}>
        {news.map(item => (
          <Grid item xs={12} md={6} lg={4} key={item.id}>
            <Card sx={{ 
              bgcolor: 'rgba(0, 0, 0, 0.2)', 
              border: '1px solid rgba(255, 179, 71, 0.2)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ color: '#ffb347', mb: 1 }}>
                  {item.title}
                </Typography>
                <Box 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    mb: 2,
                    '& img': { maxWidth: '100%', height: 'auto' },
                    '& video': { maxWidth: '100%', height: 'auto' }
                  }}
                  dangerouslySetInnerHTML={{
                    __html: item.content.length > 150 
                      ? `${item.content.substring(0, 150).replace(/<[^>]*>/g, '')}...` 
                      : item.content.replace(/<[^>]*>/g, '')
                  }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Chip 
                    label={formatDate(item.createdAt)} 
                    size="small"
                    sx={{
                      bgcolor: 'rgba(79, 140, 255, 0.1)',
                      color: '#4f8cff',
                      fontSize: '0.75rem'
                    }}
                  />
                  {item.author && (
                    <Chip 
                      label={`Автор: ${item.author.username}`}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 179, 71, 0.1)',
                        color: '#ffb347',
                        fontSize: '0.75rem'
                      }}
                    />
                  )}
                </Box>
              </CardContent>
              <Divider sx={{ borderColor: 'rgba(255, 179, 71, 0.2)' }} />
              <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                <Button
                  size="small"
                  onClick={() => handleEdit(item)}
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
                <IconButton
                  size="small"
                  onClick={() => setDeleteDialog({ open: true, id: item.id })}
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
            Вы уверены, что хотите удалить эту новость? Это действие нельзя отменить.
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
    </Box>
  );
};

export default AdminNews; 