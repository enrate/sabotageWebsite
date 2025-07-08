import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import {
  Container,
  Typography,
  Box,
  Divider,
  Chip,
  Avatar,
  Grid,
  Paper,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Card,
  CardContent,
  LinearProgress,
  Button
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  ArrowForward as ArrowForwardIcon,
  History as HistoryIcon,
  BarChart as BarChartIcon,
  CalendarToday as CalendarIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Mail as MailIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Tabs as MuiTabs, Tab as MuiTab } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
import GroupRemoveIcon from '@mui/icons-material/GroupRemove';
import GroupOffIcon from '@mui/icons-material/GroupOff';
import PercentIcon from '@mui/icons-material/Percent';
import SportsScoreIcon from '@mui/icons-material/SportsScore';

const ProfilePage = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [squad, setSquad] = useState(null);
  const [tab, setTab] = useState('stats');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [inviteError, setInviteError] = useState(null);
  const [hasInvite, setHasInvite] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(false);
  const [userWarnings, setUserWarnings] = useState([]);
  const [userAwards, setUserAwards] = useState([]);
  const [awardsLoading, setAwardsLoading] = useState(false);
  const [seasons, setSeasons] = useState([]);
  const [seasonIdx, setSeasonIdx] = useState(0);
  const [statsTab, setStatsTab] = useState('common');
  const [userStats, setUserStats] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfileData = async () => {
    setLoading(true);
    setError(null);
    setUser(null);
    setSquad(null);
    setHasInvite(false);
    
    const userId = id || (currentUser ? currentUser.id : null);
    
    if (!userId) {
      setError('Пользователь не найден');
      setLoading(false);
      return;
    }
    
      try {
        // Загружаем данные пользователя
        const userResponse = await axios.get(`/api/users/${userId}`);
        setUser(userResponse.data);
        
        // Если у пользователя есть отряд, загружаем данные отряда
        if (userResponse.data.squadId) {
          try {
            const squadResponse = await axios.get(`/api/squads/${userResponse.data.squadId}`);
            setSquad(squadResponse.data);
          } catch (squadError) {
            console.error('Ошибка загрузки отряда:', squadError);
              setSquad(null);
          }
        } else {
          setSquad(null);
        }
        
        // Проверяем, есть ли уже приглашение от текущего пользователя
        if (currentUser && currentUser.squadId && currentUser.id !== userResponse.data.id) {
          await checkExistingInvite(currentUser.squadId, userResponse.data.id);
        }

        // Загрузка предупреждений пользователя
        const token = localStorage.getItem('token');
        const warningsRes = await axios.get(`/api/admin/users/${userId}/warnings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setUserWarnings(warningsRes.data || []);

        // Загрузка наград пользователя
        setAwardsLoading(true);
        try {
          const awardsRes = await axios.get(`/api/admin/awards/user/${userId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          setUserAwards(awardsRes.data || []);
        } catch (e) {
          setUserAwards([]);
        } finally {
          setAwardsLoading(false);
        }
      } catch (userError) {
        console.error('Ошибка загрузки пользователя:', userError);
        setError('Пользователь не найден');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [id, currentUser, user?.armaId]);

  useEffect(() => {
    if (!user || !user.armaId) {
      setUserStats(null);
      return;
    }
    const fetchStats = async () => {
      try {
        const res = await axios.get(`/api/users/stats/${user.armaId}`);
        setUserStats(res.data);
      } catch {
        setUserStats(null);
      }
    };
    fetchStats();
  }, [user?.armaId]);

  useEffect(() => {
    axios.get('/api/seasons')
      .then(res => {
        setSeasons(res.data);
        setSeasonIdx(res.data.length ? res.data.length - 1 : 0);
      });
  }, []);

  // Функция проверки существующего приглашения
  const checkExistingInvite = async (squadId, userId) => {
    if (!currentUser) return;
    
    setCheckingInvite(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/squads/${squadId}/invite/check/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHasInvite(response.data.hasInvite);
    } catch (err) {
      console.error('Ошибка проверки приглашения:', err);
      setHasInvite(false);
    } finally {
      setCheckingInvite(false);
    }
  };

  if (loading) return (
    <Container maxWidth="lg" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader />
    </Container>
  );
  
  if (!user) return (
    <Container maxWidth="lg" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h6" color="error">
        {error || 'Пользователь не найден'}
      </Typography>
    </Container>
  );

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



  // Моковые данные статистики (замените на реальные данные)
  // const userStats = {
  //   totalGames: 156,
  //   wins: 89,
  //   losses: 67,
  //   winRate: 57.1,
  //   totalKills: 1920,
  //   totalDeaths: 1356,
  //   totalTeamKills: 23,
  //   kdRatio: 1.41,
  //   bestSeason: 'Сезон 5',
  //   bestPlace: 2,
  //   totalPoints: 2847
  // };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  // Проверка: может ли текущий пользователь пригласить этого пользователя в отряд
  const canInviteToSquad = () => {
    if (!currentUser || !user || currentUser.id === user.id) return false;
    if (user.squadId) return false;
    if (!currentUser.squadId) return false;
    // Проверка: лидер или заместитель
    if (!currentUser.squadRole) return false;
    return currentUser.squadRole === 'leader' || currentUser.squadRole === 'deputy';
  };

  const handleInvite = async () => {
    setInviteLoading(true);
    setInviteSuccess(null);
    setInviteError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/squads/${currentUser.squadId}/invite`, { userId: user.id }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setInviteSuccess('Приглашение отправлено!');
      setHasInvite(true);
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Ошибка отправки приглашения');
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3} alignItems="stretch">
        {/* Левая панель с информацией о пользователе */}
        <Grid item xs={12} md={3} lg={2}>
          <Paper
        elevation={8}
        sx={{
              p: 3,
              background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 3,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 179, 71, 0.2)',
              height: 'fit-content'
            }}
          >
            {/* Аватар и имя */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar
                src={user.avatar}
              sx={{
                  width: 120,
                  height: 120,
                mx: 'auto',
                mb: 2,
                  border: '3px solid #ffb347',
                  fontSize: '3rem',
                  bgcolor: user.avatar ? 'transparent' : '#ffb347'
              }}
            >
                {!user.avatar && <PersonIcon sx={{ fontSize: '3rem' }} />}
                {user.avatar && (user.username?.charAt(0)?.toUpperCase() || 'U')}
            </Avatar>
              <Typography variant="h4" sx={{ color: '#ffb347', fontWeight: 700, mb: 1 }}>
                {user.username}
              </Typography>
              <Chip 
                label={getRoleLabel(user.role)}
              sx={{
                  bgcolor: getRoleColor(user.role),
                  color: '#fff',
                  fontWeight: 600
                }}
              />
              {/* Информация о пользователе: верификация, отряд/статус, дни */}
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: 'rgba(255,255,255,0.85)', fontSize: '1rem', fontWeight: 500 }}>
                <Divider sx={{ width: '100%', bgcolor: 'rgba(255,179,71,0.5)', my: 1 }} />
                {/* Статус верификации */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ color: user.armaId ? '#4caf50' : '#f44336', fontWeight: 600 }}>
                    {user.armaId ? 'Верифицирован' : 'Не верифицирован'}
                  </span>
                </Box>
                <Divider sx={{ width: '100%', bgcolor: 'rgba(255,179,71,0.5)', my: 1 }} />
                {/* Статус поиска отряда или отряд */}
                {squad ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                    <Avatar 
                      src={squad.logo}
                      sx={{
                        width: 24, 
                        height: 24,
                        border: '1px solid rgba(255, 179, 71, 0.3)',
                        bgcolor: squad.logo ? 'transparent' : '#ffb347'
                      }}
                    >
                      {!squad.logo && <GroupIcon sx={{ fontSize: 14 }} />}
                    </Avatar>
                    <Link to={`/squads/${squad.id}`} style={{ textDecoration: 'none' }}>
                      <span style={{ color: '#ffb347', fontWeight: 600 }}>{squad.name}</span>
                    </Link>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ color: user.isLookingForSquad ? '#4caf50' : '#ff9800', fontWeight: 600 }}>
                      {user.isLookingForSquad ? 'Ищу отряд' : 'Не ищу отряд'}
                    </span>
                  </Box>
                )}
                <Divider sx={{ width: '100%', bgcolor: 'rgba(255,179,71,0.5)', my: 1 }} />
                {/* Количество дней на проекте */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>На проекте:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))} дней</span>
                </Box>
                <Divider sx={{ width: '100%', bgcolor: 'rgba(255,179,71,0.5)', my: 1 }} />
              </Box>

              {/* Кнопка написать сообщение внизу контейнера */}
              {currentUser && user.id !== currentUser.id && (
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<MailIcon />}
                    sx={{ bgcolor: '#ffb347', color: '#000', '&:hover': { bgcolor: '#ffd580' } }}
                    onClick={() => navigate(`/messages?user=${user.id}`)}
                  >
                    Написать сообщение
                  </Button>
                  {/* Кнопка пригласить в отряд */}
                  {canInviteToSquad() && (
                    <Button
                      variant="contained"
                      startIcon={<GroupIcon />}
                      disabled={inviteLoading || checkingInvite || hasInvite}
                      onClick={handleInvite}
                      sx={{ 
                        bgcolor: hasInvite ? '#666' : '#1976d2', 
                        color: '#fff',
                        '&:disabled': {
                          bgcolor: hasInvite ? '#666' : '#90caf9',
                          color: '#fff'
                        }
                      }}
                    >
                      {inviteLoading ? 'Отправка...' : 
                       checkingInvite ? 'Проверка...' : 
                       hasInvite ? 'Приглашение отправлено' : 
                       'Пригласить в отряд'}
                    </Button>
                  )}
                  {inviteSuccess && <span style={{ color: '#4caf50', fontSize: 14 }}>{inviteSuccess}</span>}
                  {inviteError && <span style={{ color: '#f44336', fontSize: 14 }}>{inviteError}</span>}
                </Box>
              )}

              {userWarnings.length > 0 && (
                <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#ff9800', fontWeight: 500, fontSize: '0.92rem' }}>
                    Активных предупреждений: {userWarnings.length}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Правая панель с контентом */}
        <Grid item xs={12} md={9} lg={10}>
          <Paper
            elevation={8}
            sx={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 179, 71, 0.2)',
              minHeight: '400px',
              height: '100%',
              //width: '100%',
              width: '1100px'
            }}
          >
            {/* Вкладки */}
            <Paper 
              elevation={0}
              sx={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '32px 32px 0 0',
                borderBottom: '1px solid rgba(255, 179, 71, 0.2)',
                overflow: 'hidden'
              }}
            >
              <Tabs
                value={tab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    textAlign: 'left',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    minHeight: 48,
                    fontSize: '1rem',
                    fontWeight: 500,
                    paddingLeft: 3,
                    borderRadius: '32px 32px 0 0',
                    '&.Mui-selected': {
                      color: '#ffb347',
                      fontWeight: 600
                    }
                  }
                }}
              >
                <Tab 
                  label="Статистика" 
                  value="stats"
                  icon={<BarChartIcon />}
                  iconPosition="start"
                />
                <Tab 
                  label="Награды и достижения" 
                  value="about"
                  icon={<TrophyIcon />}
                  iconPosition="start"
                />
              </Tabs>
            </Paper>

            {/* Контент вкладок */}
            <Box sx={{ p: 3, width: '100%' }}>
              {/* Вкладка "Награды" */}
              {tab === 'about' && (
                <Box sx={{ width: '100%' }}>
                
                  <Box sx={{ mt: 5 }}>
                    <Card sx={{ bgcolor: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,179,71,0.18)', p: 2 }}>
                      {awardsLoading ? (
                        <Typography>Загрузка...</Typography>
                      ) : userAwards.length === 0 ? (
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>Нет наград</Typography>
                      ) : (
                        <Grid container spacing={2}>
                          {userAwards.map(award => (
                            <Grid item xs={12} sm={6} md={4} key={award.id}>
                              <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.03)' }} elevation={2}>
                                <Avatar src={award.Award?.image} sx={{ bgcolor: '#ffb347', width: 56, height: 56 }}>
                                  {!award.Award?.image && <EmojiEventsIcon />}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" sx={{ color: '#ffb347', fontWeight: 600 }}>{award.Award?.name}</Typography>
                                  <Typography variant="body2" sx={{ color: '#fff' }}>{award.Award?.type}</Typography>
                                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{award.Award?.description}</Typography>
                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                    Выдано: {award.issuedAt ? new Date(award.issuedAt).toLocaleDateString() : '-'}
                                    {award.issuer && (
                                      <span> | Админ: {award.issuer.username}</span>
                                    )}
                                  </Typography>
                                </Box>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </Card>
                  </Box>
                </Box>
              )}

              {/* Вкладка "Статистика" */}
              {tab === 'stats' && (
                <Box sx={{ width: '100%' }}>
                  <MuiTabs
                    value={statsTab}
                    onChange={(_, v) => setStatsTab(v)}
                    centered
                    sx={{ mb: 3,
                      '& .MuiTab-root': {
                        color: 'rgba(255,255,255,0.7)',
                        fontWeight: 500,
                        fontSize: '1.1rem',
                        '&.Mui-selected': { color: '#ffb347', fontWeight: 700 }
                      },
                      '& .MuiTabs-indicator': { backgroundColor: '#ffb347', height: 3, borderRadius: 2 }
                    }}
                  >
                    <MuiTab label="Общая" value="common" />
                    <MuiTab label="Сезонная" value="seasonal" />
                  </MuiTabs>
                  {statsTab === 'common' && (
                    <Grid container spacing={2} sx={{ maxWidth: 700, mx: 'auto', mt: 2 }}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <TrendingUpIcon sx={{ color: '#ffb347', fontSize: 32, mb: 1 }} />
                          <Typography sx={{ color: '#ffb347', fontWeight: 700 }}>Максимальный рейтинг</Typography>
                          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{userStats?.maxElo ?? '-'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <SportsKabaddiIcon sx={{ color: '#ffb347', fontSize: 32, mb: 1 }} />
                          <Typography sx={{ color: '#ffb347', fontWeight: 700 }}>Убийств всего</Typography>
                          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{userStats?.kills ?? '-'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <GroupRemoveIcon sx={{ color: '#ffb347', fontSize: 32, mb: 1 }} />
                          <Typography sx={{ color: '#ffb347', fontWeight: 700 }}>Смертей всего</Typography>
                          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{userStats?.deaths ?? '-'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <GroupOffIcon sx={{ color: '#ffb347', fontSize: 32, mb: 1 }} />
                          <Typography sx={{ color: '#ffb347', fontWeight: 700 }}>Тимкиллов всего</Typography>
                          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{userStats?.teamKills ?? '-'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <TrendingUpIcon sx={{ color: '#ffb347', fontSize: 32, mb: 1 }} />
                          <Typography sx={{ color: '#ffb347', fontWeight: 700 }}>Средний K/D</Typography>
                          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{userStats && userStats.deaths > 0 ? (userStats.kills / userStats.deaths).toFixed(2) : userStats?.kills ?? '-'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <PercentIcon sx={{ color: '#ffb347', fontSize: 32, mb: 1 }} />
                          <Typography sx={{ color: '#ffb347', fontWeight: 700 }}>Средний % побед</Typography>
                          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{userStats?.winRate ?? '-'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <SportsScoreIcon sx={{ color: '#ffb347', fontSize: 32, mb: 1 }} />
                          <Typography sx={{ color: '#ffb347', fontWeight: 700 }}>Матчей всего</Typography>
                          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{userStats?.totalGames ?? '-'}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  )}
                  {statsTab === 'seasonal' && (
                    <Box sx={{ mt: 2 }}>
                      {seasons.length === 0 ? (
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', mb: 4 }}>Нет сезонов</Typography>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                          <Button onClick={() => setSeasonIdx(i => Math.max(0, i - 1))} disabled={seasonIdx === 0}><ArrowBackIosIcon /></Button>
                          <Paper sx={{
                            px: 4,
                            py: 2,
                            mx: 2,
                            minWidth: 220,
                            textAlign: 'center',
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: 3,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 179, 71, 0.2)',
                            boxShadow: '0 6px 32px 0 rgba(255,179,71,0.18), 0 2px 12px rgba(0,0,0,0.18)',
                            color: '#fff',
                            position: 'relative'
                          }}>
                            <Typography variant="h6" sx={{ color: '#ffb347', fontWeight: 600 }}>{seasons[seasonIdx]?.name}</Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{seasons[seasonIdx]?.startDate?.slice(0,10)} — {seasons[seasonIdx]?.endDate?.slice(0,10)}</Typography>
                          </Paper>
                          <Button onClick={() => setSeasonIdx(i => Math.min(seasons.length - 1, i + 1))} disabled={seasonIdx === seasons.length - 1}><ArrowForwardIosIcon /></Button>
                        </Box>
                      )}
                      {/* Метрики за выбранный сезон */}
                      {seasons.length > 0 && (
                        (() => {
                          const perf = user.performance?.find(p => String(p.season) === String(seasons[seasonIdx].id) || String(p.season) === String(seasons[seasonIdx].name));
                          if (!perf) return <Typography sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>Нет данных за этот сезон</Typography>;
                          return (
                            <Grid container spacing={2} sx={{ maxWidth: 600, mx: 'auto', mt: 1 }}>
                              <Grid item xs={6} sm={4}><Box sx={{ textAlign: 'center' }}><Typography sx={{ color: '#ffb347', fontWeight: 700 }}>Место</Typography><Typography variant="h5" sx={{ color: '#ffb347', fontWeight: 700 }}>{perf.place ?? '-'}</Typography></Box></Grid>
                              <Grid item xs={6} sm={4}><Box sx={{ textAlign: 'center' }}><Typography sx={{ color: '#fff', fontWeight: 700 }}>Очки</Typography><Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{perf.points ?? perf.elo ?? '-'}</Typography></Box></Grid>
                              <Grid item xs={6} sm={4}><Box sx={{ textAlign: 'center' }}><Typography sx={{ color: '#fff', fontWeight: 700 }}>K/D</Typography><Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{perf.kills && perf.deaths ? (perf.deaths ? (perf.kills / perf.deaths).toFixed(2) : perf.kills) : perf.kd ?? '-'}</Typography></Box></Grid>
                              <Grid item xs={6} sm={4}><Box sx={{ textAlign: 'center' }}><Typography sx={{ color: '#fff', fontWeight: 700 }}>Побед %</Typography><Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{perf.winrate ?? '-'}</Typography></Box></Grid>
                              <Grid item xs={6} sm={4}><Box sx={{ textAlign: 'center' }}><Typography sx={{ color: '#fff', fontWeight: 700 }}>Матчи</Typography><Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{perf.matches ?? '-'}</Typography></Box></Grid>
                            </Grid>
                          );
                        })()
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage; 