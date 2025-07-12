import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Paper, Avatar, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, Card, CardContent } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PersonIcon from '@mui/icons-material/Person';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MiniProfile from '../components/MiniProfile';

const columns = [
  { label: 'Место', key: 'place', align: 'center' },
  { label: 'Игрок', key: 'name', align: 'left' },
  { label: 'Рейтинг', key: 'elo', align: 'right' },
  { label: 'К/Д', key: 'kd', align: 'right' },
  { label: 'Убийства', key: 'kills', align: 'right' },
  { label: 'Смерти', key: 'deaths', align: 'right' },
  { label: 'Тимкиллы', key: 'teamkills', align: 'right' },
  { label: 'Win %', key: 'winrate', align: 'right' },
  { label: 'Матчи', key: 'matches', align: 'right' },
];

const SeasonsPage = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonIdx, setSeasonIdx] = useState(0);
  const [tab, setTab] = useState(0);
  const [players, setPlayers] = useState([]);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [seasonsError, setSeasonsError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userSquadData, setUserSquadData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const season = seasons[seasonIdx] || {};
  const [miniProfile, setMiniProfile] = useState({ open: false, anchorEl: null, user: null, stats: null });

  // Открытие мини-профиля
  const handleMiniProfileOpen = (event, user, stats) => {
    setMiniProfile({ open: true, anchorEl: event.currentTarget, user, stats });
  };
  // Закрытие мини-профиля
  const handleMiniProfileClose = () => {
    setMiniProfile({ open: false, anchorEl: null, user: null, stats: null });
  };
  // Отправка ЛС (заглушка)
  const handleSendMessage = (user) => {
    navigate(`/messages?user=${user.id}`);
  };

  // Функция для проверки, является ли строка профилем текущего пользователя
  const isCurrentUser = (row) => {
    return currentUser && row.id === currentUser.id;
  };

  // Функция для проверки, является ли строка отрядом текущего пользователя
  const isCurrentUserSquad = (row) => {
    return currentUser && currentUser.squadId && row.id === currentUser.squadId;
  };

  // Функция для загрузки данных пользователя и его отряда
  const loadUserData = async (seasonId) => {
    if (!currentUser || !seasonId) {
      setUserData(null);
      setUserSquadData(null);
      return;
    }

    setUserDataLoading(true);
    try {
      // Загружаем данные пользователя
      const userRes = await axios.get(`/api/seasons/player-stats`, { 
        params: { 
          seasonId,
          userId: currentUser.id 
        } 
      });
      
      if (userRes.data) {
        // Обогащаем данные пользователя
        const userData = {
          id: currentUser.id,
          username: currentUser.username,
          avatar: currentUser.avatar,
          elo: userRes.data.elo || 0,
          kills: userRes.data.kills || 0,
          deaths: userRes.data.deaths || 0,
          teamkills: userRes.data.teamkills || 0,
          winrate: userRes.data.matches ? Math.round((userRes.data.wins / userRes.data.matches) * 100) : 0,
          matches: userRes.data.matches || 0
        };
        setUserData(userData);
      } else {
        setUserData(null);
      }

      // Загружаем данные отряда пользователя
      if (currentUser.squadId) {
        const squadRes = await axios.get(`/api/seasons/squad-stats`, { 
          params: { 
            seasonId,
            squadId: currentUser.squadId 
          } 
        });
        
        if (squadRes.data) {
          // Загружаем информацию об отряде
          let squadInfo = { name: `Отряд #${currentUser.squadId}`, logo: '' };
          try {
            const squadInfoRes = await axios.get(`/api/squads/${currentUser.squadId}`);
            squadInfo = {
              name: squadInfoRes.data.name,
              logo: squadInfoRes.data.logo || ''
            };
          } catch (err) {
            console.error('Ошибка загрузки информации об отряде:', err);
          }
          
          // Обогащаем данные отряда
          const squadData = {
            id: currentUser.squadId,
            name: squadInfo.name,
            avatar: squadInfo.logo,
            elo: squadRes.data.elo || 0,
            kills: squadRes.data.kills || 0,
            deaths: squadRes.data.deaths || 0,
            teamkills: squadRes.data.teamkills || 0,
            winrate: squadRes.data.matches ? Math.round((squadRes.data.wins / squadRes.data.matches) * 100) : 0,
            matches: squadRes.data.matches || 0
          };
          setUserSquadData(squadData);
        } else {
          setUserSquadData(null);
        }
      } else {
        setUserSquadData(null);
      }
    } catch (err) {
      console.error('Ошибка загрузки данных пользователя:', err);
      setUserData(null);
      setUserSquadData(null);
    } finally {
      setUserDataLoading(false);
    }
  };

  useEffect(() => {
    setSeasonsLoading(true);
    setSeasonsError(null);
    axios.get('/api/seasons')
      .then(res => {
        setSeasons(res.data);
        setSeasonIdx(res.data.length ? res.data.length - 1 : 0);
      })
      .catch(() => setSeasonsError('Ошибка загрузки сезонов'))
      .finally(() => setSeasonsLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        const seasonId = season?.id;
        if (!seasonId) {
          setPlayers([]);
          setSquads([]);
          setLoading(false);
          return;
        }
        const [playersRes, squadsRes] = await Promise.all([
          axios.get('/api/seasons/top-players', { params: { seasonId } }),
          axios.get('/api/seasons/top-squads', { params: { seasonId } })
        ]);
        setPlayers(playersRes.data);
        setSquads(squadsRes.data);
        
        // Загружаем данные пользователя и его отряда
        await loadUserData(seasonId);
      } catch (e) {
        setError('Ошибка загрузки топа');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [season, currentUser]);

  const handlePrev = () => setSeasonIdx(idx => Math.max(0, idx - 1));
  const handleNext = () => setSeasonIdx(idx => Math.min(seasons.length - 1, idx + 1));

  // Функция для формирования данных с пользователем в начале
  const getDisplayData = () => {
    if (tab === 0) {
      // Для игроков
      const userInTop = players.some(p => p.id === currentUser?.id);
      if (userData && !userInTop) {
        return [userData, ...players];
      }
      return players;
    } else {
      // Для отрядов
      const squadInTop = squads.some(s => s.id === currentUser?.squadId);
      if (userSquadData && !squadInTop) {
        return [userSquadData, ...squads];
      }
      return squads;
    }
  };

  const data = getDisplayData();
  const nameLabel = tab === 0 ? 'Игрок' : 'Название отряда';

  // Функция для вычисления места пользователя
  const getUserPlace = (userData, topData) => {
    if (!userData || !topData.length) return '-';
    
    // Проверяем, есть ли пользователь в топе
    const userInTop = topData.findIndex(p => p.id === userData.id);
    if (userInTop !== -1) {
      // Если в топе — возвращаем его позицию
      return userInTop + 1;
    }
    
    // Если не в топе, но у него максимальное elo среди топа — показываем 1
    const maxElo = Math.max(...topData.map(p => p.elo));
    if (userData.elo === maxElo) {
      return 1;
    }
    
    return '-';
  };

  // Получаем место пользователя
  const userPlace = tab === 0 ? getUserPlace(userData, players) : getUserPlace(userSquadData, squads);

  // Для таба "Отряды" убираем winrate и matches
  const squadColumns = columns.filter(col => col.key !== 'winrate' && col.key !== 'matches');
  const usedColumns = tab === 0 ? columns : squadColumns;

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
        zIndex: 1,
        maxWidth: 1100, 
        mx: 'auto', 
        py: 6 
      }}>
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
        <Typography variant="h4" sx={{ color: '#ffb347', fontWeight: 700, mb: 3, textAlign: 'center' }}>
          Сезоны
        </Typography>
        
      {/* Карусель сезонов */}
      {seasonsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
          <CircularProgress color="warning" />
        </Box>
      ) : seasonsError ? (
        <Alert severity="error">{seasonsError}</Alert>
      ) : seasons.length === 0 ? (
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', mb: 4 }}>Нет сезонов</Typography>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
          <Button onClick={handlePrev} disabled={seasonIdx === 0}><ArrowBackIosIcon /></Button>
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
            boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
            color: '#fff',
            position: 'relative'
          }}>
            <Typography variant="h6" sx={{ color: '#ffb347', fontWeight: 600 }}>{season.name}</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{season.startDate?.slice(0,10)} — {season.endDate?.slice(0,10)}</Typography>
          </Paper>
          <Button onClick={handleNext} disabled={seasonIdx === seasons.length - 1}><ArrowForwardIosIcon /></Button>
        </Box>
      )}
      {/* Табы */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 3 }}>
        <Tab label="Игроки" />
        <Tab label="Отряды" />
      </Tabs>
      <Card
        elevation={8}
        sx={{
          p: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 3,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 179, 71, 0.2)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
          color: '#fff',
          minHeight: 400,
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          mx: 'auto'
        }}
      >
        <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <CircularProgress color="warning" />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <TableContainer sx={{ width: '100%', minWidth: 1100, mx: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {usedColumns.map(col => (
                      <TableCell key={col.key} align="left" sx={{ color: '#ffb347', fontWeight: 700, fontSize: '1rem', background: 'transparent' }}>
                        {col.key === 'name' ? nameLabel : col.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, idx) => {
                    const isUserRow = tab === 0 && isCurrentUser(row);
                    const isUserSquadRow = tab === 1 && isCurrentUserSquad(row);
                    const showSeparator = (isUserRow && idx === 0) || (isUserSquadRow && idx === 0);
                    
                    return (
                      <React.Fragment key={row.id}>
                        {showSeparator && (
                          <TableRow>
                            <TableCell 
                              colSpan={usedColumns.length} 
                              sx={{ 
                                borderBottom: '2px solid #ffb347',
                                py: 1,
                                textAlign: 'center'
                              }}
                            >
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: '#ffb347', 
                                  fontWeight: 600,
                                  fontSize: '0.9rem'
                                }}
                              >
                                {tab === 0 ? 'Ваш результат' : 'Ваш отряд'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow
                          sx={{
                            '& td': { borderBottom: '1px solid #444' },
                            ...(isUserRow ? {
                              bgcolor: 'rgba(255, 179, 71, 0.1)',
                              '&:hover': {
                                bgcolor: 'rgba(255, 179, 71, 0.15)'
                              }
                            } : {}),
                            ...(isUserSquadRow ? {
                              bgcolor: 'rgba(255, 179, 71, 0.1)',
                              '&:hover': {
                                bgcolor: 'rgba(255, 179, 71, 0.15)'
                              }
                            } : {})
                          }}
                        >
                          {usedColumns.map((col, colIdx) => {
                            if (col.key === 'place') {
                              return (
                                <TableCell align="left" sx={{ fontWeight: 700 }} key={col.key}>
                                  {showSeparator ? userPlace : idx + 1}
                                </TableCell>
                              );
                            }
                            if (col.key === 'name') {
                              return (
                                <TableCell align="left" sx={{ borderBottom: 'none' }} key={col.key}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar 
                                      src={row.avatar} 
                                      sx={{ 
                                        width: 32, 
                                        height: 32, 
                                        bgcolor: row.avatar ? 'transparent' : '#ffb347', 
                                        color: '#23242a', 
                                        fontWeight: 700, 
                                        mr: 1 
                                      }}
                                    >
                                      {!row.avatar && <PersonIcon sx={{ fontSize: 20 }} />}
                                    </Avatar>
                                    {tab === 0 ? (
                                      <Typography
                                        component={Link}
                                        to={undefined}
                                        sx={{ color: '#ffb347', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', borderBottom: 'none', '&:hover, &:focus': { color: '#ffd580', textDecoration: 'none', borderBottom: 'none' } }}
                                        onClick={e => {
                                          e.preventDefault();
                                          handleMiniProfileOpen(e, row, row);
                                        }}
                                        tabIndex={0}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleMiniProfileOpen(e, row, row);
                                          }
                                        }}
                                        aria-label={`Мини-профиль пользователя ${row.username}`}
                                      >
                                        {row.username}
                                      </Typography>
                                    ) : (
                                      <Typography
                                        component={Link}
                                        to={`/squads/${row.id}`}
                                        sx={{ color: '#ffb347', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', borderBottom: 'none', '&:hover, &:focus': { color: '#ffd580', textDecoration: 'none', borderBottom: 'none' } }}
                                      >
                                        {row.name}
                                      </Typography>
                                    )}
                                  </Box>
                                </TableCell>
                              );
                            }
                            if (col.key === 'kd') {
                              return (
                                <TableCell align="left" key={col.key}>
                                  {row.kills && row.deaths ? (row.deaths ? (row.kills / row.deaths).toFixed(2) : row.kills) : row.kd || '-'}
                                </TableCell>
                              );
                            }
                            return (
                              <TableCell align="left" key={col.key}>{row[col.key]}</TableCell>
                            );
                          })}
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      {/* MiniProfile popover */}
      <MiniProfile
        user={miniProfile.user}
        seasonStats={miniProfile.stats}
        anchorEl={miniProfile.anchorEl}
        open={miniProfile.open}
        onClose={handleMiniProfileClose}
        onSendMessage={handleSendMessage}
        currentUserId={currentUser?.id}
      />
      </Box>
    </Box>
  );
};

export default SeasonsPage; 