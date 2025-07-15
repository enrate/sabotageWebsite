import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import ServerStatus from '../components/ServerStatus';
import NewsPreview from '../components/NewsPreview';
import Loader from '../components/Loader';
import SocialBanners from '../components/SocialBanners';
import YouTube from 'react-youtube';

import { useAuth } from '../context/AuthContext';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Button,
  useTheme,
  useMediaQuery,
  Chip,
  Avatar,
  Divider
} from '@mui/material';
import {
  Computer as ComputerIcon,
  OpenInNew as OpenInNewIcon,
  WarningAmber as WarningAmberIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const TEST_SERVERS = [
  { id: 1, name: 'Arma Reforger #1', status: 'online', players: 24, scenario: 'Захват точки' },
  { id: 2, name: 'Arma Reforger #2', status: 'offline', players: 0, scenario: 'Свободная игра' },
  { id: 3, name: 'Arma Reforger #3', status: 'online', players: 12, scenario: 'Тактическая операция' },
];
const TEST_NEWS = [
  { _id: 1, title: 'Открытие нового сервера!', content: 'Мы рады объявить об открытии нового сервера для всех участников сообщества.', createdAt: new Date(), author: { username: 'Админ' } },
  { _id: 2, title: 'Обновление правил', content: 'Пожалуйста, ознакомьтесь с обновлёнными правилами поведения на сервере.', createdAt: new Date(), author: { username: 'Модератор' } },
  { _id: 3, title: 'Ивент в эти выходные', content: 'В это воскресенье состоится крупный ивент! Не пропустите!', createdAt: new Date(), author: { username: 'Организатор' } },
];

const HomePage = () => {
  const [servers, setServers] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(false);
  const [hasMoreNews, setHasMoreNews] = useState(true);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showArmaIdSnackbar, setShowArmaIdSnackbar] = useState(false);
  const newsContainerRef = useRef(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Загрузка статуса серверов
        const serversRes = await axios.get('/api/servers');
        setServers(serversRes.data);
        // Загрузка первых новостей
        setNewsLoading(true);
        const newsRes = await axios.get('/api/news/latest?limit=4&offset=0');
        setNews(newsRes.data);
        setHasMoreNews(newsRes.data.length === 4);
        setLoading(false);
        setNewsLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setLoading(false);
        setNewsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (currentUser && !currentUser.armaId) {
      setShowArmaIdSnackbar(true);
    }
  }, [currentUser]);

  // Подгрузка новостей при скролле
  useEffect(() => {
    const handleScroll = () => {
      if (newsLoading || !hasMoreNews) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMoreNews();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [news, newsLoading, hasMoreNews]);

  const loadMoreNews = async () => {
    setNewsLoading(true);
    try {
      const offset = news.length;
      const newsRes = await axios.get(`/api/news/latest?limit=4&offset=${offset}`);
      if (newsRes.data.length > 0) {
        // Исключаем дубли только по id
        const newNews = newsRes.data.filter(n => !news.some(existing => existing.id === n.id));
        setNews(prev => [...prev, ...newNews]);
        setHasMoreNews(newsRes.data.length === 4);
      } else {
        setHasMoreNews(false);
      }
    } catch (err) {
      setHasMoreNews(false);
    } finally {
      setNewsLoading(false);
    }
  };



  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        color: '#fff',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 0
        }
      }}
    >
      <Container 
        maxWidth="xl" 
        sx={{ 
          position: 'relative', 
          zIndex: 1,
          py: 5,
          pl: 0,
          pr: 0
        }}
      >
        {/* Баннер: напоминание про Arma ID */}
        {currentUser && !currentUser.armaId && (
          <Box sx={{
            bgcolor: 'rgba(255, 179, 71, 0.15)',
            border: '1px solid #ffb347',
            borderRadius: 2,
            p: 2,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            maxWidth: 700,
            mx: 'auto',
          }}>
            <WarningAmberIcon sx={{ color: '#ffb347', fontSize: 32 }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: '#ffb347', fontWeight: 600, fontSize: '1.1rem' }}>
                Для полноценного участия в проекте укажите свой Arma ID в настройках профиля.
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              sx={{ bgcolor: '#ffb347', color: '#232526', fontWeight: 600, '&:hover': { bgcolor: '#ffd580' } }}
              onClick={() => navigate('/settings')}
            >
              В настройки
            </Button>
          </Box>
        )}
        <Grid 
          container 
          spacing={isMobile ? 1.5 : 4}
          direction={isMobile ? 'column' : 'row'}
          sx={{ width: '100%', flexWrap: isMobile ? 'wrap' : undefined, mx: 0 }}
        >
          {/* Левая панель — статус серверов */}
          <Grid 
            item 
            xs={12} 
            md="auto"
            style={isMobile ? { width: '100%', maxWidth: 'unset', flexShrink: 0 } : { width:340, maxWidth:340, flexShrink:0 }}
            sx={{ mt: isMobile ? 1 : 8, mb: isMobile ? 1.5 : 0 }}
          >
            <Paper
              elevation={8}
              sx={{
                p: isMobile ? 1.2 : 3,
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 3,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                width: '100%'
              }}
            >
              <Box sx={{ textAlign: 'center', mb: isMobile ? 1.2 : 3 }}>
                <ComputerIcon sx={{ fontSize: isMobile ? 22 : 32, color: '#ffb347', mb: 1 }} />
                <Typography 
                  variant={isMobile ? 'subtitle1' : 'h6'}
                  sx={{ 
                    color: '#ffb347', 
                    fontWeight: 600,
                    fontSize: isMobile ? '1.05rem' : undefined
                  }}
                >
                  Статус серверов
                </Typography>
              </Box>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <Loader />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 1 : 1.5 }}>
                  {(servers.length ? servers : TEST_SERVERS).map(server => (
                    <ServerStatus key={server.id} server={server} />
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
          {/* Центральная колонка — новости */}
          <Grid 
            item 
            xs={12} 
            style={{ minWidth: 0, flex: 1, maxWidth: isMobile ? 'unset' : 900, width: '100%' }}
            sx={{ mx: isMobile ? 0 : 'auto', mb: isMobile ? 1.5 : 0 }}
          >
            <Box ref={newsContainerRef}>
              <Typography variant={isMobile ? 'h6' : 'h4'} sx={{ color: '#ffb347', fontWeight: 700, mb: isMobile ? 2 : 4, textAlign: 'center', fontSize: isMobile ? '1.15rem' : undefined }}>
                Новости сообщества
              </Typography>
              {news.length === 0 && !loading && (
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2, fontSize: isMobile ? '0.97rem' : undefined }}>Нет новостей</Typography>
              )}
              {/* Список новостей в столбец */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 2 : 4, width: '100%', maxWidth: isMobile ? 'unset' : 900, mx: 'auto' }}>
                {news.map(item => {
                  // Парсим первую ссылку на YouTube из текста
                  const ytMatch = (item.content || '').match(/(?:https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/))([\w-]{11})/);
                  return (
                    <Paper
                      key={item.id}
                      elevation={8}
                      sx={{
                        p: isMobile ? 1.2 : 4,
                        mb: isMobile ? 1 : 2,
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: 3,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 179, 71, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: '#ffd580',
                          transform: isMobile ? 'none' : 'translateY(-4px) scale(1.01)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: isMobile ? 1.2 : 3 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant={isMobile ? 'subtitle1' : 'h5'}
                            component="h2"
                            sx={{
                              color: '#ffb347',
                              fontWeight: 700,
                              mb: isMobile ? 0.7 : 1.5,
                              lineHeight: 1.2,
                              fontSize: isMobile ? '1.05rem' : undefined
                            }}
                          >
                            {item.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.7 : 2, flexWrap: 'wrap' }}>
                            <Chip
                              icon={<ScheduleIcon sx={{ fontSize: isMobile ? 16 : undefined }} />}
                              label={new Date(item.createdAt).toLocaleDateString('ru-RU', {
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
                                fontSize: isMobile ? '0.92rem' : undefined,
                                '& .MuiChip-icon': { color: '#ffb347', fontSize: isMobile ? 16 : undefined }
                              }}
                            />
                            <Chip
                              icon={<PersonIcon sx={{ fontSize: isMobile ? 16 : undefined }} />}
                              label={item.author?.username || 'Неизвестно'}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.8)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                fontSize: isMobile ? '0.92rem' : undefined,
                                '& .MuiChip-icon': { color: 'rgba(255, 255, 255, 0.6)', fontSize: isMobile ? 16 : undefined }
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                      <Divider sx={{ mb: isMobile ? 1.2 : 3, borderColor: 'rgba(255, 179, 71, 0.2)' }} />
                      <Box
                        sx={{
                          mb: isMobile ? 1 : 2,
                          lineHeight: 1.7,
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: isMobile ? '0.97rem' : '1.08rem',
                          minHeight: isMobile ? '2.5rem' : '4.8rem',
                          display: '-webkit-box',
                          WebkitLineClamp: isMobile ? 4 : 6,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          '& img': { maxWidth: '100%', height: 'auto', borderRadius: 2, my: 2 },
                          '& video': { maxWidth: '100%', height: 'auto', borderRadius: 2, my: 2 }
                        }}
                        dangerouslySetInnerHTML={{
                          __html: item.content.length > 150 
                            ? `${item.content.substring(0, 150).replace(/<[^>]*>/g, '')}...` 
                            : item.content.replace(/<[^>]*>/g, '')
                        }}
                      />
                      {/* YouTube Player если есть ссылка — теперь снизу */}
                      {ytMatch && (
                        <Box sx={{ mt: 1.2, display: 'flex', justifyContent: 'center' }}>
                          <YouTube
                            videoId={ytMatch[1]}
                            opts={{
                              width: '100%',
                              height: isMobile ? '180' : '320',
                              playerVars: { autoplay: 0 },
                            }}
                            style={{ borderRadius: 12, overflow: 'hidden', maxWidth: isMobile ? '100%' : 700, width: '100%' }}
                          />
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          component={Link}
                          to={`/news/${item.id}`}
                          size="small"
                          variant="outlined"
                          sx={{ color: '#ffb347', borderColor: '#ffb347', fontWeight: 600, fontSize: isMobile ? '0.97rem' : undefined, py: isMobile ? 0.7 : undefined, px: isMobile ? 1.5 : undefined, '&:hover': { bgcolor: 'rgba(255,179,71,0.08)', borderColor: '#ffd580', color: '#ffd580' } }}
                        >
                          Читать полностью
                        </Button>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
              {newsLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <Loader />
                </Box>
              )}
              {!hasMoreNews && news.length > 0 && (
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', mt: 3, fontSize: isMobile ? '0.97rem' : undefined }}>
                  Все новости загружены
                </Typography>
              )}
            </Box>
          </Grid>
          {/* Правая колонка — соц.баннеры */}
          <Grid 
            item 
            xs={12} 
            md="auto"
            style={isMobile ? { width: '100%', maxWidth: 'unset', flexShrink: 0 } : { width:340, maxWidth:340, flexShrink:0 }}
            sx={{ mt: isMobile ? 1 : 8, mb: isMobile ? 1.5 : 0 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 1.2 : 3, width: '100%' }}>
              <SocialBanners />
            </Box>
          </Grid>
        </Grid>
      </Container>
      <Snackbar
        open={showArmaIdSnackbar}
        autoHideDuration={7000}
        onClose={() => setShowArmaIdSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert onClose={() => setShowArmaIdSnackbar(false)} severity="warning" sx={{ width: '100%' }}>
          Не забудьте указать свой Arma ID в настройках профиля для верификации!
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default HomePage;