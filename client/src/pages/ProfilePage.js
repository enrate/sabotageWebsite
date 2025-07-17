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
  Button,
  Popover,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput
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
  Warning as WarningIcon,
  WarningAmber as WarningAmberIcon
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
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

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
  const [seasonalStats, setSeasonalStats] = useState(null);
  const [loadingSeasonalStats, setLoadingSeasonalStats] = useState(false);
  const [warningsAnchor, setWarningsAnchor] = useState(null);

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

        // Загрузка наград пользователя (теперь только публичный роут)
        setAwardsLoading(true);
        try {
          const awardsRes = await axios.get(`/api/awards/user/${userId}`);
          setUserAwards(awardsRes.data || []);
        } catch (e) {
          setUserAwards([]);
        } finally {
          setAwardsLoading(false);
        }

        // Загрузка предупреждений пользователя (теперь публичный роут)
        const warningsRes = await axios.get(`/api/users/${userId}/warnings`);
        setUserWarnings(warningsRes.data || []);
      } catch (userError) {
        console.error('Ошибка загрузки пользователя:', userError);
        setError('Пользователь не найден');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [id, currentUser]);

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

  useEffect(() => {
    if (!user || !user.id || seasons.length === 0) {
      setSeasonalStats(null);
      return;
    }
    setLoadingSeasonalStats(true);
    axios.get(`/api/seasons/player-stats?userId=${user.id}&seasonId=${seasons[seasonIdx]?.id}`)
      .then(res => setSeasonalStats(res.data))
      .catch(() => setSeasonalStats(null))
      .finally(() => setLoadingSeasonalStats(false));
  }, [user?.id, seasons, seasonIdx]);

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

  const handleWarningsClick = (event) => {
    setWarningsAnchor(event.currentTarget);
  };
  const handleWarningsClose = () => {
    setWarningsAnchor(null);
  };
  const warningsOpen = Boolean(warningsAnchor);

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
    // Проверка: верифицирован ли приглашаемый пользователь
    if (!user.armaId) return false;
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
      <Box sx={{ 
        position: 'relative', 
        zIndex: 1 
      }}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
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
      <Grid container spacing={isMobile ? 1.5 : 3} alignItems="stretch" direction={isMobile ? 'column' : 'row'} sx={{ width: '100%', flexWrap: { xs: 'wrap', md: 'nowrap' }, gap: isMobile ? 0 : undefined }}>
        {/* Левая панель с информацией о пользователе */}
        <Grid item xs={12} md="auto" sx={{ minWidth: isMobile ? 'unset' : 220, maxWidth: isMobile ? 'unset' : 320, flex: isMobile ? 'unset' : '0 0 auto', width: '100%' }}>
          <Paper
            elevation={8}
            sx={{
              p: isMobile ? 1.2 : 3,
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 179, 71, 0.2)',
              height: 'fit-content',
              width: '100%',
              mb: isMobile ? 1.5 : 0
            }}
          >
            {/* Аватар и имя */}
            <Box sx={{ textAlign: 'center', mb: isMobile ? 1 : 3, position: 'relative', display: 'block' }}>
              <Avatar
                src={user.avatar}
                sx={{
                  width: isMobile ? 56 : 120,
                  height: isMobile ? 56 : 120,
                  mx: 'auto',
                  mb: isMobile ? 1 : 2,
                  border: '3px solid #ffb347',
                  fontSize: isMobile ? '1.3rem' : '3rem',
                  bgcolor: user.avatar ? 'transparent' : '#ffb347'
                }}
              >
                {!user.avatar && <PersonIcon sx={{ fontSize: isMobile ? '1.3rem' : '3rem' }} />}
                {user.avatar && (user.username?.charAt(0)?.toUpperCase() || 'U')}
              </Avatar>
              {user.activeAward && (
                <Tooltip title={user.activeAward.description || user.activeAward.name} placement="top">
                  <Avatar
                    src={user.activeAward.image}
                    sx={{
                      width: isMobile ? 32 : 40,
                      height: isMobile ? 32 : 40,
                      position: 'absolute',
                      right: isMobile ? 8 : 15,
                      bottom: 0,
                      boxShadow: 2,
                      zIndex: 2,
                      m: 0,
                      p: 0
                    }}
                  />
                </Tooltip>
              )}
            </Box>
            <Box sx={{ textAlign: 'center', mb: isMobile ? 1 : 2 }}>
              <Typography variant={isMobile ? 'subtitle1' : 'h4'} sx={{ color: '#ffb347', fontWeight: 700, mb: isMobile ? 0.5 : 1, fontSize: isMobile ? '1.1rem' : undefined }}>
                {user.username}
              </Typography>
              <Chip 
                label={getRoleLabel(user.role)}
                sx={{
                  bgcolor: getRoleColor(user.role),
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: isMobile ? '0.85rem' : undefined,
                  height: isMobile ? 22 : undefined
                }}
              />
            </Box>
            {/* Социальные сети */}
            {(user.discordId || user.twitchId || user.youtubeId) && (
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 1 : 2, mt: 1 }}>
                {user.discordId && (
                  <a
                    href={`https://discord.com/users/${user.discordId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <img src="/discord-icon.png" alt="Discord" style={{ width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, cursor: 'pointer' }} />
                  </a>
                )}
                {user.twitchId && (
                  <a
                    href={`https://twitch.tv/${user.twitchUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <img src="/twitch-icon.png" alt="Twitch" style={{ width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, cursor: 'pointer' }} />
                  </a>
                )}
                {user.youtubeId && (
                  <a
                    href={user.youtubeUrl || `https://youtube.com/channel/${user.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <img src="/youtube-icon.png" alt="YouTube" style={{ width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, cursor: 'pointer' }} />
                  </a>
                )}
              </Box>
            )}
            {/* Информация о пользователе: верификация, отряд/статус, дни */}
            <Box sx={{ mt: isMobile ? 0.5 : 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? 0.3 : 1, color: 'rgba(255,255,255,0.85)', fontSize: isMobile ? '0.97rem' : '1rem', fontWeight: 500 }}>
              <Divider sx={{ width: '100%', bgcolor: 'rgba(255,179,71,0.5)', my: isMobile ? 0.3 : 1 }} />
              {!user.armaId && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ color: '#f44336', fontWeight: 600, fontSize: isMobile ? '0.95rem' : undefined }}>
                      Не верифицирован
                    </span>
                  </Box>
                  <Divider sx={{ width: '100%', bgcolor: 'rgba(255,179,71,0.5)', my: isMobile ? 0.3 : 1 }} />
                </>
              )}
              {/* Статус поиска отряда или отряд */}
              {squad ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                  <Avatar 
                    src={squad.logo}
                    sx={{
                      width: isMobile ? 18 : 24, 
                      height: isMobile ? 18 : 24,
                      border: '1px solid rgba(255, 179, 71, 0.3)',
                      bgcolor: squad.logo ? 'transparent' : '#ffb347'
                    }}
                  >
                    {!squad.logo && <GroupIcon sx={{ fontSize: isMobile ? 11 : 14 }} />}
                  </Avatar>
                  <Link to={`/squads/${squad.id}`} style={{ textDecoration: 'none' }}>
                    <span style={{ color: '#ffb347', fontWeight: 600, fontSize: isMobile ? '0.97rem' : undefined }}>{squad.name}</span>
                  </Link>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ color: user.isLookingForSquad ? '#4caf50' : '#ff9800', fontWeight: 600, fontSize: isMobile ? '0.97rem' : undefined }}>
                    {user.isLookingForSquad ? 'Ищу отряд' : 'Не ищу отряд'}
                  </span>
                </Box>
              )}
              <Divider sx={{ width: '100%', bgcolor: 'rgba(255,179,71,0.5)', my: isMobile ? 0.3 : 1 }} />
              {/* Количество дней на проекте */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>На проекте:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))} дней</span>
              </Box>
              <Divider sx={{ width: '100%', bgcolor: 'rgba(255,179,71,0.5)', my: isMobile ? 0.3 : 1 }} />
            </Box>
            {/* Кнопки */}
            {currentUser && user.id !== currentUser.id && (
              <Box sx={{ mt: isMobile ? 1 : 3, display: 'flex', flexDirection: isMobile ? 'column' : 'column', alignItems: 'center', gap: isMobile ? 0.7 : 2 }}>
                <Button
                  variant="contained"
                  startIcon={<MailIcon />}
                  sx={{ bgcolor: '#ffb347', color: '#000', '&:hover': { bgcolor: '#ffd580' }, width: isMobile ? '100%' : undefined, fontSize: isMobile ? '0.97rem' : undefined, py: isMobile ? 1 : undefined }}
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
                      },
                      width: isMobile ? '100%' : undefined,
                      fontSize: isMobile ? '0.97rem' : undefined,
                      py: isMobile ? 1 : undefined
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
            {/* Предупреждения */}
            {userWarnings.length > 0 && (
              <Box sx={{ mt: isMobile ? 1 : 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Button
                  variant="text"
                  onClick={handleWarningsClick}
                  sx={{ color: '#ff9800', fontWeight: 500, fontSize: isMobile ? '0.92rem' : '0.97rem', textTransform: 'none', p: 0, minWidth: 0, '&:hover': { bgcolor: 'rgba(255,152,0,0.08)' } }}
                >
                  Активных предупреждений: {userWarnings.length}
                </Button>
                <Popover
                  open={warningsOpen}
                  anchorEl={warningsAnchor}
                  onClose={handleWarningsClose}
                  disableScrollLock={true}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                  PaperProps={{ sx: { p: 2, bgcolor: 'rgba(30,30,30,0.98)', color: '#fff', borderRadius: 3, minWidth: 220, maxWidth: 350, boxShadow: '0 6px 32px 0 rgba(255,179,71,0.18), 0 2px 12px rgba(0,0,0,0.18)', border: '1px solid #ff9800' } }}
                >
                  <Typography sx={{ color: '#ff9800', fontWeight: 700, mb: 1, fontSize: isMobile ? '1rem' : '1.1rem' }}>Активные предупреждения</Typography>
                  {userWarnings.map((w, idx) => (
                    <Box key={w.id || idx} sx={{ mb: 2, pb: 1, borderBottom: idx < userWarnings.length-1 ? '1px solid #444' : 'none' }}>
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, mb: 0.5, fontSize: isMobile ? '0.97rem' : undefined }}>
                        Причина: {w.reason || '—'}
                      </Typography>
                      {w.description && (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 0.5, wordBreak: 'break-all', fontSize: isMobile ? '0.97rem' : undefined }}>
                          {w.description}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: isMobile ? '0.92rem' : undefined }}>
                        Выдал: {w.admin?.username || '—'}<br/>
                        Дата: {w.createdAt ? new Date(w.createdAt).toLocaleString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </Typography>
                    </Box>
                  ))}
                </Popover>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Правая панель с контентом */}
        <Grid item xs={12} md sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <Paper
            elevation={8}
            sx={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 179, 71, 0.2)',
              minHeight: isMobile ? 'unset' : '400px',
              height: '100%',
              width: '100%',
              p: isMobile ? 1.2 : 3,
              boxSizing: 'border-box',
              alignSelf: 'stretch',
              display: 'flex',
              flexDirection: 'column',
              flex: 1
            }}
          >
            {/* Вкладки */}
            <Paper 
              elevation={0}
              sx={{
                background: 'rgba(0, 0, 0, 0.1)',
                border: 0,
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
                    textAlign: 'center',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: isMobile ? 36 : 48,
                    fontSize: isMobile ? '0.97rem' : '1rem',
                    fontWeight: 500,
                    paddingLeft: 0,
                    borderRadius: 0,
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
                  icon={<BarChartIcon sx={{ fontSize: isMobile ? 18 : 22 }} />}
                  iconPosition="start"
                />
                <Tab 
                  label="Матчи" 
                  value="matches"
                  icon={<HistoryIcon sx={{ fontSize: isMobile ? 18 : 22 }} />}
                  iconPosition="start"
                />
                <Tab 
                  label="Награды и достижения" 
                  value="about"
                  icon={<TrophyIcon sx={{ fontSize: isMobile ? 18 : 22 }} />}
                  iconPosition="start"
                />
              </Tabs>
            </Paper>
            {/* Контент вкладок */}
            <Box sx={{ p: isMobile ? 1 : 3, width: '100%' }}>
              {tab === 'matches' && (
                <ProfileMatchHistory armaId={user.armaId} />
              )}
              {/* Вкладка "Награды" */}
              {tab === 'about' && (
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ mt: isMobile ? 1 : 5 }}>
                    <Card sx={{ bgcolor: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,179,71,0.18)', p: isMobile ? 1 : 2 }}>
                      {awardsLoading ? (
                        <Typography>Загрузка...</Typography>
                      ) : userAwards.length === 0 ? (
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>Нет наград</Typography>
                      ) : (
                        <Grid container spacing={isMobile ? 1 : 2}>
                          {userAwards.map(award => (
                            <Grid item xs={12} key={award.id}>
                              <Paper sx={{ p: isMobile ? 1 : 2, display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2, bgcolor: 'rgba(255,255,255,0.03)' }} elevation={2}>
                                <Avatar src={award.image} sx={{ width: isMobile ? 40 : 56, height: isMobile ? 40 : 56 }}>
                                  {!award.image && <EmojiEventsIcon />}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ color: '#ffb347', fontWeight: 600, fontSize: isMobile ? '1rem' : undefined }}>{award.name}</Typography>
                                  <Typography variant="body2" sx={{ color: '#fff', fontSize: isMobile ? '0.97rem' : undefined }}>{award.type}</Typography>
                                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: isMobile ? '0.97rem' : undefined }}>{award.description}</Typography>
                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? '0.92rem' : undefined }}>
                                    {award.isActive && <span style={{ color: '#4caf50', fontWeight: 600 }}>Активная награда | </span>}
                                    Выдано: {award.issuedAt ? new Date(award.issuedAt).toLocaleDateString() : '-'}
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
                    sx={{ mb: isMobile ? 1 : 3,
                      '& .MuiTab-root': {
                        color: 'rgba(255,255,255,0.7)',
                        fontWeight: 500,
                        fontSize: isMobile ? '0.97rem' : '1.1rem',
                        '&.Mui-selected': { color: '#ffb347', fontWeight: 700 }
                      },
                      '& .MuiTabs-indicator': { backgroundColor: '#ffb347', height: 3, borderRadius: 2 }
                    }}
                  >
                    <MuiTab label="Общая" value="common" />
                    <MuiTab label="Сезонная" value="seasonal" />
                  </MuiTabs>
                  {statsTab === 'common' && (
                    <Grid container spacing={isMobile ? 1 : 2} sx={{ maxWidth: 700, mx: 'auto', mt: isMobile ? 1 : 2 }}>
                      {/* Все карточки по одной в ряд на мобилке */}
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: isMobile ? 1 : 2 }}>
                          <TrendingUpIcon sx={{ color: '#ffb347', fontSize: isMobile ? 24 : 32, mb: 1 }} />
                          <Typography sx={{ color: '#ffb347', fontWeight: 700, fontSize: isMobile ? '0.97rem' : undefined }}>Максимальный рейтинг</Typography>
                          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? '1.1rem' : undefined }}>{userStats?.maxElo ?? '0'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: isMobile ? 1 : 2 }}>
                          <SportsKabaddiIcon sx={{ color: '#ffb347', fontSize: isMobile ? 24 : 32, mb: 1 }} />
                          <Typography sx={{ color: '#ffb347', fontWeight: 700, fontSize: isMobile ? '0.97rem' : undefined }}>Убийств всего</Typography>
                          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? '1.1rem' : undefined }}>{userStats?.kills ?? '0'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: isMobile ? 1 : 2 }}>
                          <GroupRemoveIcon sx={{ color: '#ffb347', fontSize: isMobile ? 24 : 32, mb: 1 }} />
                          <Typography sx={{ color: '#ffb347', fontWeight: 700, fontSize: isMobile ? '0.97rem' : undefined }}>Смертей всего</Typography>
                          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? '1.1rem' : undefined }}>{userStats?.deaths ?? '0'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: isMobile ? 1 : 2 }}>
                          <GroupOffIcon sx={{ color: '#ffb347', fontSize: isMobile ? 24 : 32, mb: 1 }} />
                          <Typography sx={{ color: '#ffb347', fontWeight: 700, fontSize: isMobile ? '0.97rem' : undefined }}>Тимкиллы всего</Typography>
                          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? '1.1rem' : undefined }}>{userStats?.teamKills ?? '0'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: isMobile ? 1 : 2 }}>
                          <TrendingUpIcon sx={{ color: '#ffb347', fontSize: isMobile ? 24 : 32, mb: 1 }} />
                          <Typography sx={{ color: '#ffb347', fontWeight: 700, fontSize: isMobile ? '0.97rem' : undefined }}>K/D</Typography>
                          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? '1.1rem' : undefined }}>{userStats && userStats.deaths > 0 ? (userStats.kills / userStats.deaths).toFixed(2) : userStats?.kills ?? '0'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: isMobile ? 1 : 2 }}>
                          <PercentIcon sx={{ color: '#ffb347', fontSize: isMobile ? 24 : 32, mb: 1 }} />
                          <Typography sx={{ color: '#ffb347', fontWeight: 700, fontSize: isMobile ? '0.97rem' : undefined }}>% побед</Typography>
                          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? '1.1rem' : undefined }}>{userStats?.winRate ?? '0'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: isMobile ? 1 : 2 }}>
                          <SportsScoreIcon sx={{ color: '#ffb347', fontSize: isMobile ? 24 : 32, mb: 1 }} />
                          <Typography sx={{ color: '#ffb347', fontWeight: 700, fontSize: isMobile ? '0.97rem' : undefined }}>Матчей всего</Typography>
                          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? '1.1rem' : undefined }}>{userStats?.totalGames ?? '0'}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  )}
                  {statsTab === 'seasonal' && (
                    <Box sx={{ mt: isMobile ? 1 : 2 }}>
                      {seasons.length === 0 ? (
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', mb: isMobile ? 1 : 4, fontSize: isMobile ? '0.97rem' : undefined }}>Нет сезонов</Typography>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: isMobile ? 1 : 3 }}>
                          <Button onClick={() => setSeasonIdx(i => Math.max(0, i - 1))} disabled={seasonIdx === 0} sx={{ minWidth: isMobile ? 28 : 36, px: isMobile ? 0.5 : 1 }}><ArrowBackIosIcon sx={{ fontSize: isMobile ? 16 : 20 }} /></Button>
                          <Paper sx={{
                            px: isMobile ? 1.2 : 4,
                            py: isMobile ? 0.7 : 2,
                            mx: isMobile ? 0.5 : 2,
                            minWidth: isMobile ? 120 : 220,
                            textAlign: 'center',
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: 3,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 179, 71, 0.2)',
                            boxShadow: '0 6px 32px 0 rgba(255,179,71,0.18), 0 2px 12px rgba(0,0,0,0.18)',
                            color: '#fff',
                            position: 'relative'
                          }}>
                            <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ color: '#ffb347', fontWeight: 600, fontSize: isMobile ? '1rem' : undefined }}>{seasons[seasonIdx]?.name}</Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: isMobile ? '0.97rem' : undefined }}>{seasons[seasonIdx]?.startDate?.slice(0,10)} — {seasons[seasonIdx]?.endDate?.slice(0,10)}</Typography>
                          </Paper>
                          <Button onClick={() => setSeasonIdx(i => Math.min(seasons.length - 1, i + 1))} disabled={seasonIdx === seasons.length - 1} sx={{ minWidth: isMobile ? 28 : 36, px: isMobile ? 0.5 : 1 }}><ArrowForwardIosIcon sx={{ fontSize: isMobile ? 16 : 20 }} /></Button>
                        </Box>
                      )}
                      {/* Метрики за выбранный сезон */}
                      {loadingSeasonalStats ? (
                        <Box sx={{ textAlign: 'center', my: isMobile ? 1 : 4 }}><LinearProgress color="warning" /></Box>
                      ) : seasons.length > 0 && seasonalStats ? (
                        <Grid container spacing={isMobile ? 1 : 2} sx={{ maxWidth: 700, mx: 'auto', mt: isMobile ? 1 : 2 }}>
                          {/* Все карточки по одной в ряд на мобилке */}
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ textAlign: 'center', p: isMobile ? 1 : 2 }}>
                              <TrendingUpIcon sx={{ color: '#ffb347', fontSize: isMobile ? 24 : 32, mb: 1 }} />
                              <Typography sx={{ color: '#ffb347', fontWeight: 700, fontSize: isMobile ? '0.97rem' : undefined }}>Рейтинг (эло)</Typography>
                              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? '1.1rem' : undefined }}>{seasonalStats.elo ?? '0'}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ textAlign: 'center', p: isMobile ? 1 : 2 }}>
                              <SportsKabaddiIcon sx={{ color: '#ffb347', fontSize: isMobile ? 24 : 32, mb: 1 }} />
                              <Typography sx={{ color: '#ffb347', fontWeight: 700, fontSize: isMobile ? '0.97rem' : undefined }}>Убийства</Typography>
                              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? '1.1rem' : undefined }}>{seasonalStats.kills ?? '0'}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ textAlign: 'center', p: isMobile ? 1 : 2 }}>
                              <GroupRemoveIcon sx={{ color: '#ffb347', fontSize: isMobile ? 24 : 32, mb: 1 }} />
                              <Typography sx={{ color: '#ffb347', fontWeight: 700, fontSize: isMobile ? '0.97rem' : undefined }}>Смерти</Typography>
                              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? '1.1rem' : undefined }}>{seasonalStats.deaths ?? '0'}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ textAlign: 'center', p: isMobile ? 1 : 2 }}>
                              <TrendingUpIcon sx={{ color: '#ffb347', fontSize: isMobile ? 24 : 32, mb: 1 }} />
                              <Typography sx={{ color: '#ffb347', fontWeight: 700, fontSize: isMobile ? '0.97rem' : undefined }}>K/D</Typography>
                              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? '1.1rem' : undefined }}>{seasonalStats.deaths > 0 ? (seasonalStats.kills / seasonalStats.deaths).toFixed(2) : seasonalStats.kills ?? '0'}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ textAlign: 'center', p: isMobile ? 1 : 2 }}>
                              <PercentIcon sx={{ color: '#ffb347', fontSize: isMobile ? 24 : 32, mb: 1 }} />
                              <Typography sx={{ color: '#ffb347', fontWeight: 700, fontSize: isMobile ? '0.97rem' : undefined }}>% побед</Typography>
                              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? '1.1rem' : undefined }}>
                                {(seasonalStats?.wins !== undefined && seasonalStats?.matches > 0)
                                  ? ((seasonalStats.wins / seasonalStats.matches) * 100).toFixed(1)
                                  : '0'}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ textAlign: 'center', p: isMobile ? 1 : 2 }}>
                              <SportsScoreIcon sx={{ color: '#ffb347', fontSize: isMobile ? 24 : 32, mb: 1 }} />
                              <Typography sx={{ color: '#ffb347', fontWeight: 700, fontSize: isMobile ? '0.97rem' : undefined }}>Матчей</Typography>
                              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? '1.1rem' : undefined }}>{seasonalStats.matches ?? '0'}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ textAlign: 'center', p: isMobile ? 1 : 2 }}>
                              <GroupOffIcon sx={{ color: '#ffb347', fontSize: isMobile ? 24 : 32, mb: 1 }} />
                              <Typography sx={{ color: '#ffb347', fontWeight: 700, fontSize: isMobile ? '0.97rem' : undefined }}>Тимкиллы</Typography>
                              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? '1.1rem' : undefined }}>{seasonalStats?.teamkills ?? '0'}</Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      ) : seasons.length > 0 ? (
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: isMobile ? '0.97rem' : undefined }}>Нет данных за этот сезон</Typography>
                      ) : null}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
        </Container>
      </Box>
    </Box>
  );
};

function ProfileMatchHistory({ armaId }) {
  const [matches, setMatches] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [open, setOpen] = React.useState({});
  const [hasMore, setHasMore] = React.useState(true);
  const [isFetchingMore, setIsFetchingMore] = React.useState(false);
  const [totalCount, setTotalCount] = React.useState(0);
  const offsetRef = React.useRef(0);
  const PAGE_SIZE = 8;
  const [startDate, setStartDate] = React.useState(null);
  const [endDate, setEndDate] = React.useState(null);
  const [missionNames, setMissionNames] = React.useState([]);
  const [allMissions, setAllMissions] = React.useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  React.useEffect(() => {
    const fetchAllMissions = async () => {
      try {
        const res = await axios.get('/api/match-history?limit=1000&offset=0');
        const names = Array.from(new Set(res.data.matches.map(m => m.missionName).filter(Boolean)));
        setAllMissions(names);
      } catch {}
    };
    fetchAllMissions();
  }, []);

  const fetchMatches = async (reset = false) => {
    if (!armaId) return;
    if (reset) {
      setLoading(true);
      setError(null);
      setMatches([]);
      setHasMore(true);
      offsetRef.current = 0;
    } else {
      setIsFetchingMore(true);
    }
    try {
      const params = {
        limit: PAGE_SIZE,
        offset: offsetRef.current,
        armaId,
      };
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();
      if (missionNames.length > 0) params.missionNames = missionNames;
      const res = await axios.get('/api/match-history', { params });
      if (reset) {
        setMatches(res.data.matches);
        setTotalCount(res.data.totalCount);
        setHasMore(res.data.matches.length < res.data.totalCount);
        offsetRef.current = res.data.matches.length;
      } else {
        setMatches(prev => [...prev, ...res.data.matches]);
        offsetRef.current += res.data.matches.length;
        setHasMore(offsetRef.current < res.data.totalCount);
      }
    } catch (e) {
      setError('Ошибка загрузки истории матчей');
      setHasMore(false);
    } finally {
      if (reset) setLoading(false);
      else setIsFetchingMore(false);
    }
  };

  React.useEffect(() => {
    fetchMatches(true);
    // eslint-disable-next-line
  }, [armaId]);

  React.useEffect(() => {
    const handleScroll = () => {
      if (loading || isFetchingMore || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        fetchMatches(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line
  }, [matches, loading, isFetchingMore, hasMore]);

  React.useEffect(() => {
    fetchMatches(true);
    // eslint-disable-next-line
  }, [startDate, endDate, missionNames]);

  const toggleOpen = (sessionId) => {
    setOpen(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
  };

  const cleanMissionName = (name) => name ? name.replace(/^[0-9]+_/, '') : '';
  const ACCENT = '#ffb347';
  const CARD_BG = 'rgba(0, 0, 0, 0.4)';
  const CARD_SHADOW = '0 8px 32px 0 rgba(0,0,0,0.18), 0 2px 10px rgba(255,179,71,0.10)';
  const BORDER = '2px solid #ffb347';
  const CARD_BORDER = '1.5px solid rgba(255,179,71,0.18)';
  const CARD_RADIUS = 12;
  const IMAGE_PLACEHOLDER = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80';

  // Функция для поиска игрока по id
  const getPlayerName = (players, id) => {
    let p = players.find(p => p.entityId === id);
    if (!p) p = players.find(p => p.playerIdentity === id);
    if (!p) p = players.find(p => String(p.PlayerId) === String(id));
    return p ? (p.name || p.playerIdentity || p.PlayerId || id) : id;
  };
  // Функция для рендера игрока с ссылкой
  const renderPlayer = (players, id) => {
    const player = players.find(p => p.playerIdentity === id || p.entityId === id || String(p.PlayerId) === String(id));
    if (!player) return <b>{id}</b>;
    return player.userId ? (
      <Link to={`/profile/${player.userId}`} style={{ color: ACCENT, textDecoration: 'none', fontWeight: 600 }}>{player.name || player.playerIdentity || player.PlayerId || id}</Link>
    ) : (
      <b>{player.name || player.playerIdentity || player.PlayerId || id}</b>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
          <DateTimePicker
            label="Дата и время с"
            value={startDate}
            onChange={setStartDate}
            ampm={false}
            slotProps={{ textField: { sx: { minWidth: 160, background: '#181818', borderRadius: 2, color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ffb347' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ffb347' }, input: { color: '#fff' }, label: { color: '#ffb347' }, }, size: 'small' } }}
          />
          <DateTimePicker
            label="по"
            value={endDate}
            onChange={setEndDate}
            ampm={false}
            slotProps={{ textField: { sx: { minWidth: 160, background: '#181818', borderRadius: 2, color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ffb347' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ffb347' }, input: { color: '#fff' }, label: { color: '#ffb347' }, }, size: 'small' } }}
          />
        </LocalizationProvider>
        <FormControl sx={{ minWidth: 160 }} size="small">
          <InputLabel id="mission-multiselect-label" sx={{ color: '#ffb347', fontWeight: 600 }}>Сценарии</InputLabel>
          <Select
            labelId="mission-multiselect-label"
            id="mission-multiselect"
            multiple
            value={missionNames}
            onChange={e => {
              const values = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
              if (values.includes('__all__')) {
                setMissionNames([]);
              } else {
                setMissionNames(values);
              }
            }}
            input={<OutlinedInput label="Сценарии" />}
            MenuProps={{
              disableScrollLock: true,
              PaperProps: {
                style: {
                  maxHeight: 48 * 4.5 + 8,
                  width: 250,
                  background: '#181818',
                  color: '#fff',
                },
              },
            }}
            sx={{ background: '#181818', borderRadius: 2, color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ffb347' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ffb347' }, }}
            renderValue={selected => selected.length === 0 ? 'Все' : selected.map(val => cleanMissionName(val)).join(', ')}
          >
            <MenuItem value="__all__" style={{ color: '#bbb', fontStyle: 'italic' }}>Все</MenuItem>
            {allMissions.map(m => (
              <MenuItem
                key={m}
                value={m}
                style={{ fontWeight: missionNames.includes(m) ? theme.typography.fontWeightMedium : theme.typography.fontWeightRegular }}
              >
                {cleanMissionName(m)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      {loading && <Box sx={{ textAlign: 'center', color: '#bbb', py: 4 }}>Загрузка...</Box>}
      {error && <Box sx={{ textAlign: 'center', color: '#ff4d4f', py: 4 }}>{error}</Box>}
      {!loading && !error && matches.length === 0 && (
        <Box sx={{ textAlign: 'center', color: '#bbb', py: 4 }}>Нет данных о матчах</Box>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {matches.map(match => {
          const factionsWithObjectives = (match.factionObjectives || []).filter(f => f.objectives && f.objectives.length > 0);
          const img = match.missionImage || IMAGE_PLACEHOLDER;
          return (
            <Box
              key={match.sessionId}
              sx={{
                background: CARD_BG,
                border: CARD_BORDER,
                borderRadius: 0,
                boxShadow: CARD_SHADOW,
                p: 0,
                mb: 0,
                position: 'relative',
                overflow: 'hidden',
                minHeight: 90,
                backdropFilter: 'blur(8px)',
                transition: 'box-shadow 0.25s, border 0.25s',
              }}
            >
              {/* Кликабельная мини-карточка */}
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, pb: 1, cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleOpen(match.sessionId)}
              >
                <Box sx={{ flexShrink: 0, width: 56, height: 56, borderRadius: 2, overflow: 'hidden', boxShadow: '0 2px 8px #0007', border: '2px solid #444', background: '#222' }}>
                  <img src={img} alt="mission" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 18, color: ACCENT, letterSpacing: 0.5, mb: 0.5 }}>{cleanMissionName(match.missionName) || 'Сценарий неизвестен'}</Typography>
                  <Typography sx={{ color: '#bbb', fontSize: 14, mb: 0.5 }}>{new Date(match.date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</Typography>
                  <Typography sx={{ color: '#fff', fontSize: 14, mt: 0.5 }}>
                    <b style={{ color: ACCENT }}>Участники:</b>{' '}
                    {match.players.map((p, idx) => (
                      <React.Fragment key={p.playerIdentity ?? p.entityId ?? p.PlayerId ?? idx}>
                        <b>{p.name || p.playerIdentity || p.PlayerId || (p.entityId ?? idx)}</b>
                        {idx < match.players.length - 1 && ', '}
                      </React.Fragment>
                    ))}
                  </Typography>
                </Box>
                <Box sx={{ fontSize: 22, color: ACCENT, userSelect: 'none', ml: 1, transition: 'transform 0.2s', transform: open[match.sessionId] ? 'rotate(180deg)' : 'none' }}>
                  ▼
                </Box>
              </Box>
              {/* Развёрнутая часть */}
              <Box
                sx={{
                  maxHeight: open[match.sessionId] ? 2000 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.45s cubic-bezier(.4,2,.6,1)',
                  background: open[match.sessionId] ? CARD_BG : 'none',
                  borderTop: open[match.sessionId] ? CARD_BORDER : 'none',
                  boxShadow: open[match.sessionId] ? CARD_SHADOW : 'none',
                  // borderBottomLeftRadius: open[match.sessionId] ? CARD_RADIUS : 0,
                  // borderBottomRightRadius: open[match.sessionId] ? CARD_RADIUS : 0,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  backdropFilter: open[match.sessionId] ? 'blur(8px)' : 'none',
                  transitionProperty: 'max-height, background, box-shadow, border, backdrop-filter',
                  transitionDuration: '0.45s, 0.25s, 0.25s, 0.25s, 0.25s',
                }}
              >
                {open[match.sessionId] && (
                  <Box sx={{ p: 2, pt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2, flexWrap: 'wrap' }}>
                      {factionsWithObjectives.map((f, i) => (
                        <Box key={i} sx={{ flex: '1 1 220px', minWidth: 180, background: 'rgba(255,255,255,0.04)', borderRadius: 2, p: 1.5, border: '1.5px solid #333', mb: 1 }}>
                          <Typography sx={{ color: ACCENT, fontWeight: 700, fontSize: 15, mb: 0.5 }}>
                            {f.factionKey}
                            <span style={{ color: f.resultName && f.resultName.toLowerCase().includes('victory') ? '#4caf50' : '#ff4d4f', fontWeight: 600, marginLeft: 8 }}>
                              {f.resultName && f.resultName.toLowerCase().includes('victory') ? 'Победа' : f.resultName && f.resultName.toLowerCase().includes('loss') ? 'Поражение' : ''}
                            </span>
                          </Typography>
                          <Typography sx={{ color: '#fff', fontWeight: 500, mb: 0.5 }}>Задачи:</Typography>
                          <ul style={{ margin: 0, paddingLeft: 18, marginBottom: 6 }}>
                            {f.objectives.map((o, j) => (
                              <li key={j} style={{ color: o.completed ? '#4caf50' : '#ff4d4f', fontSize: 13 }}>
                                {o.name} — {o.completed ? 'Выполнено' : 'Не выполнено'} (очки: {o.score})
                              </li>
                            ))}
                          </ul>
                          <Typography sx={{ color: '#fff', fontWeight: 500, mb: 0.5 }}>Участники:</Typography>
                          <ul style={{ margin: 0, paddingLeft: 18, marginBottom: 0 }}>
                            {match.players.filter(p => p.faction === f.factionKey).map((p, idx) => (
                                <li key={p.playerIdentity ?? p.entityId ?? p.PlayerId ?? idx}>
                                  {/* Кликабельный ник */}
                                  {renderPlayer(match.players, p.playerIdentity ?? p.entityId ?? p.PlayerId ?? idx)}
                                  {typeof p.eloAfter === 'number' && typeof p.eloChange === 'number' && (
                                    <span style={{ color: p.eloChange > 0 ? '#4caf50' : p.eloChange < 0 ? '#ff4d4f' : '#bbb', fontWeight: 500, marginLeft: 6 }}>
                                      {p.eloAfter} ({p.eloChange > 0 ? '+' : ''}{p.eloChange})
                                    </span>
                                  )}
                                </li>
                              ))}
                            {match.players.filter(p => p.faction === f.factionKey).length === 0 && <li style={{ color: '#bbb', fontSize: 13 }}>Нет участников</li>}
                          </ul>
                        </Box>
                      ))}
                    </Box>
                    {/* Зрители */}
                    {match.players.filter(p => !p.faction).length > 0 && (
                      <Box sx={{ color: '#bbb', fontSize: 15, mb: 1.5 }}>
                        <b style={{ color: ACCENT }}>Зрители:</b>{' '}
                        {match.players.filter(p => !p.faction).map((p, idx, arr) => (
                          <span key={p.playerIdentity ?? p.entityId ?? p.PlayerId ?? idx}>
                            <b>{p.name || p.playerIdentity || p.PlayerId || (p.entityId ?? idx)}</b>
                            {typeof p.eloAfter === 'number' && typeof p.eloChange === 'number' && (
                              <span style={{ color: p.eloChange > 0 ? '#4caf50' : p.eloChange < 0 ? '#ff4d4f' : '#bbb', fontWeight: 500, marginLeft: 6 }}>
                                {p.eloAfter} ({p.eloChange > 0 ? '+' : ''}{p.eloChange})
                              </span>
                            )}
                            {idx < arr.length - 1 && ', '}
                          </span>
                        ))}
                      </Box>
                    )}
                    {/* История убийств */}
                    <Box sx={{ color: '#fff', fontSize: 14, mt: 1 }}>
                      <b>История убийств:</b>
                      <ul style={{ margin: 0, paddingLeft: 18, marginBottom: 0 }}>
                        {(!match.kills || match.kills.length === 0) && <li style={{ color: '#bbb' }}>Нет убийств</li>}
                        {match.kills && match.kills.map((k, i) => {
                          const killer = renderPlayer(match.players, k.killerId);
                          const victim = renderPlayer(match.players, k.victimId);
                          let type = 'Убийство';
                          let color = '#fff';
                          if (k.isSuicide) { type = 'Суицид'; color = '#ff4d4f'; }
                          else if (k.isTeamkill) { type = 'Тимкилл'; color = '#ffd700'; }
                          return (
                            <li key={i} style={{ marginBottom: 2 }}>
                              <span style={{ color }}>{type}:</span>{' '}
                              <b>{killer}</b>{type === 'Суицид' ? '' : ' → '}<b>{type === 'Суицид' ? '' : victim}</b>
                              {' '}<span style={{ color: '#bbb', fontSize: 12 }}>{k.systemTime ? new Date(k.systemTime * 1000).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                              {k.killerFaction && k.victimFaction && (
                                <span style={{ color: '#bbb', fontSize: 12 }}> [{k.killerFaction} → {k.victimFaction}]</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
      {isFetchingMore && (
        <Box sx={{ textAlign: 'center', color: '#bbb', my: 2 }}>Загрузка...</Box>
      )}
      {!hasMore && matches.length > 0 && (
        <Box sx={{ textAlign: 'center', color: '#bbb', my: 2 }}>Все матчи загружены</Box>
      )}
    </Box>
  );
}

export default ProfilePage; 