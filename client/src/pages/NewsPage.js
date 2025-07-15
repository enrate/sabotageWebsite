import React, { useEffect, useState } from 'react';
console.log('NewsPage rendered');
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Grid, 
  Chip, 
  Avatar, 
  Box, 
  Divider, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Paper,
  Fab,
  Tooltip,
  Skeleton,
  Alert,
  Breadcrumbs
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  ChatBubble as ChatBubbleIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import Comments from '../components/Comments';
import YouTube from 'react-youtube';

const NewsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [news, setNews] = useState(null);
  const [newsList, setNewsList] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      axios.get(`/api/news/${id}`)
        .then(res => {
          setNews(res.data);
          setLoading(false);
        })
        .catch(() => {
          setError('Новость не найдена');
          setLoading(false);
        });
    } else {
      axios.get('/api/news')
        .then(res => {
          setNewsList(res.data);
          setLoading(false);
        })
        .catch(() => {
          setError('Ошибка загрузки новостей');
          setLoading(false);
        });
    }
  }, [id]);

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/news/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteDialogOpen(false);
      navigate('/');
    } catch (error) {
      alert('Ошибка при удалении новости');
    }
  };

  if (loading) {
    console.log('Return: loading', { loading });
    return <Loader />;
  }
  if (error) {
    console.log('Return: error', { error });
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
      <Alert severity="error">{error}</Alert>
    </Container>
  );
  }
  if (id) {
    if (!news) {
      console.log('Return: news not found', { id, news });
      return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning">Новость не найдена</Alert>
      </Container>
    );
    }
    console.log('Return: single news', { id, news });
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>

        {/* Single News Article */}
        <Paper 
          elevation={8}
          sx={{ 
            p: 4, 
            mb: 4,
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 179, 71, 0.2)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
            <Avatar 
              sx={{ 
                mr: 3, 
                bgcolor: '#ffb347',
                width: 64,
                height: 64
              }}
            >
              <PersonIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  color: '#ffb347',
                  fontWeight: 700,
                  mb: 2,
                  lineHeight: 1.2
                }}
              >
                {news.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<ScheduleIcon />} 
                  label={new Date(news.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 179, 71, 0.1)',
                    color: '#ffb347',
                    border: '1px solid rgba(255, 179, 71, 0.3)',
                    '& .MuiChip-icon': {
                      color: '#ffb347'
                    }
                  }}
                />
                <Chip 
                  icon={<PersonIcon />} 
                  label={news.author?.username || 'Неизвестно'}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    '& .MuiChip-icon': {
                      color: 'rgba(255, 255, 255, 0.6)'
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: 4, borderColor: 'rgba(255, 179, 71, 0.2)' }} />

          {/* Сначала текст, потом YouTube-плеер */}
          <Box 
            sx={{ 
              mb: 4, 
              lineHeight: 1.8,
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '1.1rem',
              '& img': { maxWidth: '100%', height: 'auto', borderRadius: 2, my: 2 },
              '& video': { maxWidth: '100%', height: 'auto', borderRadius: 2, my: 2 },
              '& h1, & h2, & h3, & h4, & h5, & h6': { color: '#ffb347', mt: 3, mb: 2 },
              '& p': { mb: 2 },
              '& ul, & ol': { mb: 2, pl: 3 },
              '& li': { mb: 1 },
              '& blockquote': { 
                borderLeft: '4px solid #ffb347', 
                pl: 2, 
                ml: 0, 
                my: 2,
                fontStyle: 'italic',
                color: 'rgba(255, 255, 255, 0.8)'
              },
              '& a': { color: '#ffb347', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }
            }}
            dangerouslySetInnerHTML={{ __html: news.content }}
          />
          {/* YouTube Player если есть ссылка в тексте */}
          {(() => {
            const ytMatch = (news.content || '').match(/(?:https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/))([\w-]{11})/);
            if (ytMatch) {
              return (
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                  <YouTube
                    videoId={ytMatch[1]}
                    opts={{
                      width: '100%',
                      height: '380',
                      playerVars: { autoplay: 0 },
                    }}
                    style={{ borderRadius: 12, overflow: 'hidden', maxWidth: 700, width: '100%' }}
                  />
                </Box>
              );
            }
            return null;
          })()}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>

            {currentUser?.role === 'admin' && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  component={Link}
                  to={`/admin/news/edit/${id}`}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      bgcolor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  Редактировать
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                  sx={{
                    color: '#f44336',
                    borderColor: '#f44336',
                    '&:hover': {
                      borderColor: '#d32f2f',
                      bgcolor: 'rgba(244, 67, 54, 0.1)'
                    }
                  }}
                >
                  Удалить
                </Button>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={deleteDialogOpen} 
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              background: 'rgba(0, 0, 0, 0.9)',
              borderRadius: 3,
              border: '1px solid rgba(255, 179, 71, 0.2)',
              backdropFilter: 'blur(10px)'
            }
          }}
        >
          <DialogTitle sx={{ color: '#ffb347', fontWeight: 600 }}>
            Удалить новость?
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Вы уверены, что хотите удалить новость "{news.title}"? Это действие нельзя отменить.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleDelete} 
              variant="contained"
              sx={{
                bgcolor: '#f44336',
                color: '#fff',
                '&:hover': {
                  bgcolor: '#d32f2f'
                }
              }}
            >
              Удалить
            </Button>
          </DialogActions>
        </Dialog>

        {/* Комментарии */}
        <Comments newsId={id} />
      </Container>
    );
  }
  console.log('newsList', newsList);
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <div style={{ background: 'blue', color: '#fff', padding: 8, marginBottom: 8 }}>
        DEBUG: Я точно рендерюсь!
      </div>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Новости сообщества
        </Typography>
      </Box>

      {/* News List */}
      {newsList.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Пока нет новостей
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Будьте первым, кто поделится новостью с сообществом
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {newsList.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card 
                elevation={2} 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    elevation: 8,
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {item.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.content.length > 150 
                      ? `${item.content.substring(0, 150)}...` 
                      : item.content
                    }
                  </Typography>

                  {console.log('item', item)}
                  <div style={{ background: 'red', color: '#fff', padding: 8, marginBottom: 8 }}>
                    КОММЕНТАРИИ: {item.commentsCount}
                  </div>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      icon={<ScheduleIcon />} 
                      label={new Date(item.createdAt).toLocaleDateString('ru-RU')}
                      size="small"
                      variant="outlined"
                    />
                    <Chip 
                      icon={<PersonIcon />} 
                      label={item.author?.username || 'Неизвестно'}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<ChatBubbleIcon />}
                      label={Number(item.commentsCount) || 0}
                      size="small"
                      variant="filled"
                      sx={{ ml: 1, bgcolor: '#ffb347', color: '#000', fontWeight: 700 }}
                    />
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Button 
                    size="small" 
                    component={Link} 
                    to={`/news/${item.id}`}
                    startIcon={<VisibilityIcon />}
                  >
                    Читать
                  </Button>

                  {currentUser?.role === 'admin' && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        component={Link} 
                        to={`/admin/news/edit/${item.id}`}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => {
                          if (window.confirm('Удалить эту новость?')) {
                            // Handle delete
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating Action Button for Admin */}
      {currentUser?.role === 'admin' && (
        <Tooltip title="Добавить новость" placement="left">
          <Fab 
            color="primary" 
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            component={Link}
            to="/admin/news/create"
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      )}
    </Container>
  );
};

export default NewsPage;