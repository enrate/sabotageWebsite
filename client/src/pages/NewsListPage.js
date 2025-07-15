import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Paper,
  Fab,
  Tooltip,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Article as ArticleIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ChatBubble as ChatBubbleIcon
} from '@mui/icons-material';
import YouTube from 'react-youtube';

console.log('NewsListPage rendered');

const NewsListPage = ({ sx }) => {
  const { currentUser } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/news');
        setNews(response.data);
      } catch (err) {
        console.error('Ошибка загрузки новостей:', err);
        setError('Ошибка загрузки новостей');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const handleDelete = async (newsId) => {
    if (window.confirm('Удалить эту новость?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/news/${newsId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNews(news.filter(item => item.id !== newsId));
      } catch (error) {
        alert('Ошибка при удалении новости');
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ width: '100%', ...sx }}>
      {/* Заголовок */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            color: '#ffb347', 
            fontWeight: 700, 
            mb: 2,
            textShadow: '0 2px 4px rgba(255, 179, 71, 0.3)'
          }}
        >
          Новости сообщества
        </Typography>
      </Box>

      {/* Список новостей */}
      {news.length === 0 ? (
        <Paper
          elevation={8}
          sx={{
            p: 4,
            textAlign: 'center',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 179, 71, 0.2)'
          }}
        >
          <ArticleIcon sx={{ fontSize: 64, color: 'rgba(255, 179, 71, 0.5)', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
            Пока нет новостей
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Будьте первым, кто поделится новостью с сообществом
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3,
          width: '100%'
        }}>
          {news.map((item) => {
            // Парсим первую ссылку на YouTube из текста
            const ytMatch = (item.content || '').match(/(?:https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu.be\/|youtube.com\/embed\/|youtube.com\/v\/))([\w-]{11})/);
            return (
              <Box key={item.id} sx={{ 
                flex: '1 1 100%',
                width: '100%'
              }}>
                <Card
                  elevation={8}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 3,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 179, 71, 0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 10px 32px 0 rgba(255,179,71,0.22), 0 4px 16px rgba(0,0,0,0.18)',
                      borderColor: '#ffd580'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* YouTube Player если есть ссылка */}
                    {ytMatch && (
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <YouTube
                          videoId={ytMatch[1]}
                          opts={{
                            width: '100%',
                            height: '320',
                            playerVars: { autoplay: 0 },
                          }}
                          style={{ borderRadius: 12, overflow: 'hidden', maxWidth: 700, width: '100%' }}
                        />
                      </Box>
                    )}
                    {/* Заголовок */}
                    <Link to={`/news/${item.id}`} style={{ textDecoration: 'none' }}>
                      <Typography 
                        variant="h6" 
                        component="h2" 
                        sx={{ 
                          color: '#ffb347',
                          fontWeight: 600,
                          mb: 2,
                          lineHeight: 1.3,
                          minHeight: '3rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          transition: 'color 0.2s',
                          cursor: 'pointer',
                          '&:hover': { color: '#ffd580' }
                        }}
                      >
                        {item.title}
                      </Typography>
                    </Link>
                    
                    {/* Контент */}
                    <Box 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.8)',
                        mb: 3,
                        lineHeight: 1.6,
                        minHeight: '4.8rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        '& img': { maxWidth: '100%', height: 'auto' },
                        '& video': { maxWidth: '100%', height: 'auto' }
                      }}
                      dangerouslySetInnerHTML={{
                        __html: item.content.length > 150 
                          ? `${item.content.substring(0, 150).replace(/<[^>]*>/g, '')}...` 
                          : item.content.replace(/<[^>]*>/g, '')
                      }}
                    />

                    {/* Метаданные */}
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
                        label={`${Number(item.commentsCount) || 0} комментариев`}
                        size="small"
                        variant="outlined"
                        sx={{
                          bgcolor: 'rgba(255, 179, 71, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 179, 71, 0.3)',
                          fontWeight: 500
                        }}
                      />
                    </Box>
                  </CardContent>

                  {/* Действия */}
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Button 
                        size="small" 
                        component={Link} 
                        to={`/news/${item.id}`}
                        startIcon={<VisibilityIcon />}
                        sx={{
                          color: '#ffb347',
                          '&:hover': {
                            bgcolor: 'rgba(255, 179, 71, 0.1)'
                          }
                        }}
                      >
                        Читать
                      </Button>

                      {currentUser?.role === 'admin' && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button
                            size="small"
                            component={Link}
                            to={`/admin/news/edit/${item.id}`}
                            sx={{
                              minWidth: 'auto',
                              p: 1,
                              color: 'rgba(255, 255, 255, 0.7)',
                              '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.1)'
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </Button>
                          <Button
                            size="small"
                            onClick={() => handleDelete(item.id)}
                            sx={{
                              minWidth: 'auto',
                              p: 1,
                              color: '#f44336',
                              '&:hover': {
                                bgcolor: 'rgba(244, 67, 54, 0.1)'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default NewsListPage; 