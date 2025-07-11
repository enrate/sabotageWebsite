import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import ServerStatus from '../components/ServerStatus';
import NewsPreview from '../components/NewsPreview';
import Loader from '../components/Loader';

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
  Avatar
} from '@mui/material';
import {
  Chat as ChatIcon,
  YouTube as YouTubeIcon,
  Computer as ComputerIcon,
  Article as ArticleIcon,
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
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showArmaIdSnackbar, setShowArmaIdSnackbar] = useState(false);
  const [newsToShow, setNewsToShow] = useState(4);
  const newsContainerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загрузка статуса серверов
        const serversRes = await axios.get('/api/servers');
        setServers(serversRes.data);
        
        // Загрузка последних новостей
        const newsRes = await axios.get('/api/news/latest');
        setNews(newsRes.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (currentUser && !currentUser.armaId) {
      setShowArmaIdSnackbar(true);
    }
  }, [currentUser]);

  // Подгрузка новостей при скролле
  useEffect(() => {
    const handleScroll = () => {
      if (!newsContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        setNewsToShow(prev => {
          if (prev < news.length) return Math.min(prev + 4, news.length);
          return prev;
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [news.length]);

  // Сброс newsToShow при обновлении новостей
  useEffect(() => {
    setNewsToShow(4);
  }, [news]);

  const SocialBanner = ({ icon: Icon, title, description, link, color, bgColor }) => (
    <Card
      elevation={8}
      sx={{
        mb: 2,
        background: bgColor,
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
          borderColor: 'rgba(255, 255, 255, 0.2)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: color,
              mr: 2,
              width: 48,
              height: 48
            }}
          >
            <Icon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              {description}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<OpenInNewIcon />}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.3)',
              transform: 'scale(1.05)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Присоединиться
        </Button>
      </CardContent>
    </Card>
  );

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
        <Grid container spacing={4}>
          {/* Левая панель — статус серверов */}
          <Grid item style={{width:340, maxWidth:340, flexShrink:0}} sx={{mt: 8}}>
            <Paper
              elevation={8}
              sx={{
                p: 3,
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 3,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <ComputerIcon sx={{ fontSize: 32, color: '#ffb347', mb: 1 }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#ffb347', 
                    fontWeight: 600 
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {(servers.length ? servers : TEST_SERVERS).map(server => (
                    <ServerStatus key={server.id} server={server} />
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
          {/* Центральная колонка — новости */}
          <Grid item xs style={{flex:1, display:'flex'}}>
            <Box sx={{ width: '100%', flex: 1, maxWidth: 'none' }}>
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
                <Box ref={newsContainerRef} sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                  {news.slice(0, newsToShow).map((item) => (
                    <Card
                      key={item.id}
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
                            __html: item.content.length > 200 
                              ? item.content.substring(0, 200) + '...' 
                              : item.content
                          }}
                        />
                        
                        {/* Метаданные */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              icon={<ScheduleIcon />} 
                              label={new Date(item.createdAt).toLocaleDateString('ru-RU', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
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
                              label={item.author?.username || 'Неизвестно'}
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
                      </CardContent>
                    </Card>
                  ))}
                  {newsToShow < news.length && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                      <Button variant="outlined" onClick={() => setNewsToShow(prev => Math.min(prev + 4, news.length))} sx={{ color: '#ffb347', borderColor: '#ffb347', '&:hover': { bgcolor: 'rgba(255,179,71,0.08)', borderColor: '#ffd580' } }}>
                        Показать ещё
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Grid>
          {/* Правая колонка — соц.баннеры */}
          <Grid item style={{width:340, maxWidth:340, flexShrink:0}} sx={{mt: 8}}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <SocialBanner
                icon={ChatIcon}
                title="Наш Discord"
                description="Присоединяйтесь к сообществу"
                link="https://discord.gg/TjFyzhN7QG"
                color="#5865f2"
                bgColor="linear-gradient(135deg, #5865f2 0%, #4752c4 100%)"
              />
              <SocialBanner
                icon={YouTubeIcon}
                title="Наш YouTube"
                description="Смотрите наши видео"
                link="https://www.youtube.com/@sbtgenrate"
                color="#ff0000"
                bgColor="linear-gradient(135deg, #ff0000 0%, #cc0000 100%)"
              />
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