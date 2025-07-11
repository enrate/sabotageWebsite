import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import SquadList from '../components/SquadList';
import CreateSquadModal from '../components/CreateSquadModal';
import JoinSquadModal from '../components/JoinSquadModal';
import Loader from '../components/Loader';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  WarningAmber as WarningAmberIcon
} from '@mui/icons-material';

const TEST_SQUADS = [
  { id: 1, name: 'Alpha', leader: { username: 'Командир1' }, members: [1,2,3], description: 'Элитный отряд специального назначения', isJoinRequestOpen: true },
  { id: 2, name: 'Bravo', leader: { username: 'Командир2' }, members: [4,5], description: 'Тактическая группа поддержки', isJoinRequestOpen: false },
  { id: 3, name: 'Charlie', leader: { username: 'Командир3' }, members: [6], description: 'Разведывательный отряд', isJoinRequestOpen: true },
];

// Временный компонент SquadCard
const SquadCard = ({ squad, onClose }) => {
  if (!squad) return null;
  return (
    <div className="squad-card-modal">
      <button className="close-btn" onClick={onClose}>Закрыть</button>
      <h2>{squad.name}</h2>
      {/* TODO: логотип, описание, результативность, роли, статистика */}
      <p>Описание: {squad.description || 'Нет описания'}</p>
      <p>Лидер: {squad.leader?.username || 'Неизвестно'}</p>
      <p>Участников: {squad.members?.length || 0}</p>
      <h4>Список участников:</h4>
      <ul>
        {squad.members?.map((member, idx) => (
          <li key={member.id || idx}>{member.username || member} {/* TODO: роль */}</li>
        ))}
      </ul>
      {/* TODO: результативность и статистика */}
    </div>
  );
};

const SquadPage = () => {
  const { currentUser, updateUser } = useAuth();
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [tab, setTab] = useState(0);
  const [lookingUsers, setLookingUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [inviteLoading, setInviteLoading] = useState({});
  const [inviteSuccess, setInviteSuccess] = useState({});
  const [inviteError, setInviteError] = useState({});
  const [hasInvite, setHasInvite] = useState({});
  const [checkingInvite, setCheckingInvite] = useState({});
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [invitesError, setInvitesError] = useState(null);
  const [inviteAction, setInviteAction] = useState({}); // { [inviteId]: 'accepted'|'declined'|null }
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [searchPlayer, setSearchPlayer] = useState('');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [invitesChecking, setInvitesChecking] = useState(false);
  const [readyToRender, setReadyToRender] = useState(false);

  // Основной useEffect для загрузки данных по табу
  useEffect(() => {
    setReadyToRender(false); // сбрасываем при смене таба
    if (tab === 0) {
      setLoading(true);
      axios.get('/api/squads').then(res => {
        setSquads(res.data);
        setLoading(false);
        setReadyToRender(true);
      }).catch(() => {
        setLoading(false);
        setReadyToRender(true);
      });
    } else if (tab === 1) {
      setLoadingUsers(true);
      axios.get('/api/users/looking-for-squad').then(res => {
        setLookingUsers(res.data);
        setLoadingUsers(false);
        // не выставляем readyToRender — ждём checkExistingInvite
      }).catch(() => {
        setLoadingUsers(false);
        setReadyToRender(true); // даже если ошибка, чтобы не зависло
      });
    } else if (tab === 2 && currentUser && !currentUser.squadId) {
      setInvitesLoading(true);
      setInvitesError(null);
      axios.get('/api/squads/invites', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => setInvites(res.data))
        .catch(() => setInvitesError('Ошибка загрузки приглашений'))
        .finally(() => setInvitesLoading(false));
      setReadyToRender(true);
    }
  }, [tab]);

  // Изменённая функция checkExistingInvite
  const checkExistingInvite = async (squadId, userId) => {
    if (!currentUser) return { userId, hasInvite: false };
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/squads/${squadId}/invite/check/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { userId, hasInvite: response.data.hasInvite };
    } catch (err) {
      return { userId, hasInvite: false };
    }
  };

  // useEffect для проверки приглашений только после загрузки lookingUsers и если пользователь лидер/заместитель
  useEffect(() => {
    if (
      tab === 1 &&
      currentUser &&
      currentUser.squadId &&
      (currentUser.squadRole === 'leader' || currentUser.squadRole === 'deputy') &&
      lookingUsers.length > 0
    ) {
      setInvitesChecking(true);
      Promise.all(
        lookingUsers.map(user =>
          canInviteToSquad(user)
            ? checkExistingInvite(currentUser.squadId, user.id)
            : Promise.resolve({ userId: user.id, hasInvite: false })
        )
      ).then(results => {
        const hasInviteObj = {};
        results.forEach(r => { hasInviteObj[r.userId] = r.hasInvite; });
        setHasInvite(hasInviteObj);
        setInvitesChecking(false);
        setReadyToRender(true); // теперь можно рендерить
      });
    } else if (tab === 1 && lookingUsers.length > 0) {
      // если не лидер/зам, но есть пользователи — сразу рендерим
      setReadyToRender(true);
    }
    // eslint-disable-next-line
  }, [tab, currentUser, lookingUsers]);

  // --- Новый useEffect для открытия таба приглашений по state ---
  useEffect(() => {
    if (location.state?.openInvitesTab && currentUser && !currentUser.squadId) {
      setTab(2);
      // Очищаем state, чтобы при повторном переходе не было эффекта
      navigate('/squads', { replace: true, state: {} });
    }
  }, [location.state, currentUser, navigate]);

  useEffect(() => {
    // При открытии таба 'В поиске отряда' обновляем currentUser с бэка
    if (tab === 1) {
      const token = localStorage.getItem('token');
      if (token) {
        axios.get('/api/auth/user', {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
          updateUser(res.data);
        })
        .catch(() => {});
      }
    }
  }, [tab]);

  const handleSquadCreated = (newSquad) => {
    setSquads([...squads, newSquad]);
    setShowCreateModal(false);
    // Обновляем currentUser, чтобы кнопка сразу пропала
    if (currentUser) {
      updateUser({ ...currentUser, squadId: newSquad.id });
    }
  };

  const handleJoinSquad = (squadId) => {
    setSquads(squads.map(squad => 
      squad._id === squadId 
        ? { ...squad, members: [...squad.members, currentUser._id] } 
        : squad
    ));
    setShowJoinModal(false);
  };

  // Функция приглашения пользователя в отряд
  const handleInvite = async (userId) => {
    setInviteLoading(prev => ({ ...prev, [userId]: true }));
    setInviteSuccess(prev => ({ ...prev, [userId]: null }));
    setInviteError(prev => ({ ...prev, [userId]: null }));
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/squads/${currentUser.squadId}/invite`, { userId }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setInviteSuccess(prev => ({ ...prev, [userId]: 'Приглашение отправлено!' }));
      setHasInvite(prev => ({ ...prev, [userId]: true }));
    } catch (err) {
      setInviteError(prev => ({ ...prev, [userId]: err.response?.data?.message || 'Ошибка отправки приглашения' }));
    } finally {
      setInviteLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Проверка: может ли текущий пользователь пригласить этого пользователя в отряд
  const canInviteToSquad = (user) => {
    if (!currentUser || !user || currentUser.id === user.id) return false;
    if (user.squadId) return false;
    if (!currentUser.squadId) return false;
    // Проверка: лидер или заместитель
    // Если есть squadRole — стандартная логика
    if (currentUser.squadRole) {
      if (!user.armaId) return false;
      return currentUser.squadRole === 'leader' || currentUser.squadRole === 'deputy';
    }
    // Если squadRole нет, но пользователь — лидер своего отряда
    if (currentUser.squad && currentUser.id === currentUser.squad.leaderId) {
      if (!user.armaId) return false;
      return true;
    }
    return false;
  };

  const handleAcceptInvite = async (inviteId, squadId) => {
    setInviteAction(prev => ({ ...prev, [inviteId]: 'loading' }));
    try {
      await axios.patch(`/api/squads/invite/${inviteId}/accept`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setInviteAction(prev => ({ ...prev, [inviteId]: 'accepted' }));
      // После успешного вступления — редирект на страницу отряда
      setTimeout(() => navigate(`/squads/${squadId}`), 800);
    } catch {
      setInviteAction(prev => ({ ...prev, [inviteId]: null }));
      alert('Ошибка принятия приглашения');
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    setInviteAction(prev => ({ ...prev, [inviteId]: 'loading' }));
    try {
      await axios.patch(`/api/squads/invite/${inviteId}/decline`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setInviteAction(prev => ({ ...prev, [inviteId]: 'declined' }));
    } catch {
      setInviteAction(prev => ({ ...prev, [inviteId]: null }));
      alert('Ошибка отклонения приглашения');
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
          px: 3
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
        {/* Заголовок страницы */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              color: '#ffb347', 
              fontWeight: 700,
              mb: 2
            }}
          >
            Отряды сообщества
          </Typography>
        </Box>
        
        {/* Tabs + Кнопка создания отряда */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            mb: 4
          }}
        >
          {/* Кнопка создания отряда слева */}
          {currentUser && !currentUser.squadId && (
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateModal(true)}
              sx={{
                bgcolor: '#ffb347',
                color: '#232526',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 3,
                position: 'absolute',
                left: 0,
                '&:hover': {
                  bgcolor: '#ffd580',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(255, 179, 71, 0.3)'
                },
                transition: 'all 0.3s ease',
                '@media (max-width: 900px)': {
                  position: 'static',
                  mb: 2
                }
              }}
            >
              Создать отряд
            </Button>
          )}
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Отряды" />
            <Tab label="В поиске отряда" />
            {currentUser && !currentUser.squadId && <Tab label="Мои приглашения" />}
          </Tabs>
        </Box>
        {tab === 0 && (
          <>
            {/* Поиск отряда */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <input
                type="text"
                placeholder="Поиск отряда..."
                value={search || ''}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: 400,
                  padding: '12px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 179, 71, 0.3)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </Box>
            {/* Список отрядов */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Loader />
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 3,
                width: '100%'
              }}>
                {(squads.length ? squads : TEST_SQUADS)
                  .filter(squad => !search || squad.name.toLowerCase().includes(search.toLowerCase()))
                  .map((squad) => (
                  <Box key={squad._id || squad.id} sx={{ 
                    flex: '1 1 calc(50% - 12px)',
                    minWidth: '300px'
                  }}>
                    <Card
                      elevation={8}
                      sx={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: 3,
                        border: '1px solid rgba(255, 179, 71, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(10px)',
                        height: '100%',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 25px rgba(255, 179, 71, 0.2)',
                          borderColor: '#ffb347'
                        }
                      }}
                      onClick={() => navigate(`/squads/${squad._id || squad.id}`)}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar
                            src={squad.logo}
                            sx={{
                              bgcolor: squad.logo ? 'transparent' : '#ffb347',
                              width: 48,
                              height: 48,
                              mr: 2,
                              border: squad.logo ? '1px solid rgba(255, 179, 71, 0.3)' : 'none'
                            }}
                          >
                            {!squad.logo && <GroupIcon />}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                color: '#ffb347',
                                fontWeight: 600,
                                mb: 0.5
                              }}
                            >
                              {squad.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Chip
                                label={`${squad.members?.length || 0} участников`}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(255, 179, 71, 0.1)',
                                  color: '#ffb347',
                                  fontSize: '0.75rem'
                                }}
                              />
                              {squad.isJoinRequestOpen ? (
                                <Chip
                                  icon={<CheckCircleIcon />}
                                  label="Набор открыт"
                                  size="small"
                                  sx={{
                                    bgcolor: 'rgba(76, 175, 80, 0.2)',
                                    color: '#4caf50',
                                    fontSize: '0.75rem',
                                    '& .MuiChip-icon': {
                                      color: '#4caf50'
                                    }
                                  }}
                                />
                              ) : (
                                <Chip
                                  icon={<CancelIcon />}
                                  label="Набор закрыт"
                                  size="small"
                                  sx={{
                                    bgcolor: 'rgba(244, 67, 54, 0.2)',
                                    color: '#f44336',
                                    fontSize: '0.75rem',
                                    '& .MuiChip-icon': {
                                      color: '#f44336'
                                    }
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            mb: 2,
                            lineHeight: 1.5,
                            wordBreak: 'break-word', // перенос длинных слов
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {squad.description || 'Описание отряда отсутствует'}
                        </Typography>
                        <Divider sx={{ my: 2, borderColor: 'rgba(255, 179, 71, 0.2)' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon sx={{ fontSize: 16, color: '#ffb347', mr: 1 }} />
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontSize: '0.85rem'
                              }}
                            >
                              Лидер:
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#fff',
                              fontWeight: 600,
                              fontSize: '0.85rem'
                            }}
                          >
                            {squad.leader?.username || 'Неизвестно'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            )}
            {/* Модальные окна */}
            {showCreateModal && (
              <CreateSquadModal 
                onClose={() => setShowCreateModal(false)} 
                onSquadCreated={handleSquadCreated} 
              />
            )}
            {showJoinModal && (
              <JoinSquadModal 
                onClose={() => setShowJoinModal(false)} 
                onJoinSquad={handleJoinSquad} 
              />
            )}
          </>
        )}
        {tab === 1 && (
          !readyToRender ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Loader />
            </Box>
          ) : (
            <Box>
              {/* Поиск игроков */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <input
                  type="text"
                  placeholder="Поиск игрока..."
                  value={searchPlayer}
                  onChange={e => setSearchPlayer(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: 400,
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 179, 71, 0.3)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, width: '100%' }}>
                {lookingUsers.filter(user =>
                  !searchPlayer ||
                  (user.username && user.username.toLowerCase().includes(searchPlayer.toLowerCase())) ||
                  (user.description && user.description.toLowerCase().includes(searchPlayer.toLowerCase()))
                ).length === 0 ? (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    width: '100%'
                  }}>
                    <PersonIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                      Нет игроков в поиске отряда
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      Игроки, ищущие отряд, появятся здесь
                    </Typography>
                  </Box>
                ) :
                  lookingUsers.filter(user =>
                    !searchPlayer ||
                    (user.username && user.username.toLowerCase().includes(searchPlayer.toLowerCase())) ||
                    (user.description && user.description.toLowerCase().includes(searchPlayer.toLowerCase()))
                  ).map(user => (
                    <Box key={user.id} sx={{ 
                      flex: '1 1 calc(33.333% - 16px)',
                      minWidth: '320px',
                      maxWidth: '400px'
                    }}>
                      <Card
                        elevation={8}
                        sx={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          borderRadius: 4,
                          border: '1px solid rgba(255, 179, 71, 0.2)',
                          transition: 'all 0.3s ease',
                          backdropFilter: 'blur(10px)',
                          height: '100%',
                          overflow: 'hidden',
                          '&:hover': {
                            transform: 'translateY(-6px)',
                            boxShadow: '0 12px 30px rgba(255, 179, 71, 0.25)',
                            borderColor: '#ffb347'
                          }
                        }}
                      >
                        {/* Верхняя часть с аватаром и основной информацией */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3, pb: 0 }}>
                          <Avatar src={user.avatar} sx={{ width: 56, height: 56, bgcolor: user.avatar ? 'transparent' : '#ffb347', color: '#23242a', fontWeight: 700 }}>
                            {!user.avatar && <PersonIcon sx={{ fontSize: 32 }} />}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ color: '#ffb347', fontWeight: 700, mb: 0.5, fontSize: '1.1rem' }}>
                              {user.username}
                            </Typography>
                            <Chip
                              label="В поиске отряда"
                              size="small"
                              sx={{
                                bgcolor: 'rgba(76, 175, 80, 0.2)',
                                color: '#4caf50',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            />
                          </Box>
                        </Box>
                        {/* Описание */}
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            lineHeight: 1.6,
                            mb: 2,
                            fontStyle: user.description ? 'normal' : 'italic',
                            px: 3,
                            mt: 1 // добавлен отступ сверху
                          }}
                        >
                          {user.description || 'Описание отсутствует'}
                        </Typography>
                        {/* Статистика игрока */}
                        <Box sx={{ p: 3 }}>
                          <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: 2, 
                            mb: 3 
                          }}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255, 179, 71, 0.05)', borderRadius: 2 }}>
                              <Typography variant="h5" sx={{ color: '#ffb347', fontWeight: 700, mb: 0.5 }}>
                                {user.stats?.elo ?? '-'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
                                Рейтинг (сезон)
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(79, 140, 255, 0.05)', borderRadius: 2 }}>
                              <Typography variant="h5" sx={{ color: '#4f8cff', fontWeight: 700, mb: 0.5 }}>
                                {user.stats?.matches ?? '-'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
                                Матчей (сезон)
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mb: 3,
                            p: 2,
                            bgcolor: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: 2
                          }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600 }}>
                                {user.stats?.kills ?? '-'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Убийств
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 600 }}>
                                {user.stats?.deaths ?? '-'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Смертей
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="body2" sx={{ color: '#ff9800', fontWeight: 600 }}>
                                {user.stats?.teamkills ?? '-'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Тимкиллов
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="body2" sx={{ color: '#9c27b0', fontWeight: 600 }}>
                                {user.stats?.winRate ? `${user.stats.winRate}%` : '-'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Win Rate
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600 }}>
                                {user.stats?.wins ?? '-'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Побед
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="body2" sx={{ color: '#bdbdbd', fontWeight: 600 }}>
                                {user.stats?.losses ?? '-'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Поражений
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        {/* Кнопки действий */}
                        <Box sx={{ display: 'flex', gap: 2, px: 3, pb: 3 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ color: '#ffb347', borderColor: '#ffb347', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,179,71,0.08)', borderColor: '#ffd580', color: '#ffd580' } }}
                            component={Link}
                            to={`/profile/${user.id}`}
                          >
                            Профиль
                          </Button>
                          {canInviteToSquad(user) && !hasInvite[user.id] && (
                            <Button
                              variant="contained"
                              size="small"
                              sx={{ bgcolor: '#ffb347', color: '#232526', fontWeight: 600, '&:hover': { bgcolor: '#ffd580' } }}
                              disabled={inviteLoading[user.id]}
                              onClick={() => handleInvite(user.id)}
                            >
                              {inviteLoading[user.id] ? '...' : 'Пригласить'}
                            </Button>
                          )}
                          {canInviteToSquad(user) && hasInvite[user.id] && (
                            <Button
                              variant="outlined"
                              size="small"
                              sx={{ color: '#bbb', borderColor: '#bbb', fontWeight: 600, cursor: 'default' }}
                              disabled
                            >
                              Приглашение отправлено
                            </Button>
                          )}
                        </Box>
                      </Card>
                    </Box>
                  ))
                }
              </Box>
            </Box>
          )
        )}
        {tab === 2 && currentUser && !currentUser.squadId && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h5" sx={{ color: '#ffb347', mb: 3 }}>Мои приглашения в отряд</Typography>
            {invitesLoading ? (
              <Loader />
            ) : invitesError ? (
              <Typography color="error">{invitesError}</Typography>
            ) : invites.length === 0 ? (
              <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>У вас нет приглашений в отряд</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {invites.map(invite => (
                  <Card key={invite.id} sx={{ p: 2, background: 'rgba(0,0,0,0.25)', borderRadius: 2, border: '1px solid rgba(255,179,71,0.18)', color: '#fff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography>
                        <b>Пригласил: </b>
                        <Link to={`/profile/${invite.inviter?.id}`} style={{ color: '#ffb347', textDecoration: 'none' }}>{invite.inviter?.username}</Link>
                      </Typography>
                      <Typography>
                        <b>Отряд: </b>
                        <Link to={`/squads/${invite.squad?.id}`} style={{ color: '#ffb347', textDecoration: 'none' }}>{invite.squad?.name}</Link>
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {new Date(invite.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      {inviteAction[invite.id] === 'declined' ? (
                        <Typography color="error">Приглашение отклонено</Typography>
                      ) : inviteAction[invite.id] === 'accepted' ? (
                        <Typography color="success.main">Вы вступили в отряд</Typography>
                      ) : invite.status === 'declined' ? (
                        <Typography color="error">Приглашение отклонено</Typography>
                      ) : invite.status === 'accepted' ? (
                        <Typography color="success.main">Вы уже вступили в этот отряд</Typography>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button variant="contained" color="success" disabled={inviteAction[invite.id] === 'loading'} onClick={() => handleAcceptInvite(invite.id, invite.squad?.id)}>
                            {inviteAction[invite.id] === 'loading' ? '...' : 'Принять'}
                          </Button>
                          <Button variant="outlined" color="error" disabled={inviteAction[invite.id] === 'loading'} onClick={() => handleDeclineInvite(invite.id)}>
                            Отклонить
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default SquadPage;