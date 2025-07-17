import React, { useState, useEffect } from "react";
import { Grid, Card, CardContent, Typography, CircularProgress, Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Button, TableContainer } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activity, setActivity] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [topPlayers, setTopPlayers] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [scenarioStats, setScenarioStats] = useState([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [onlineStats, setOnlineStats] = useState([]);
  const [loadingOnline, setLoadingOnline] = useState(true);
  const [onlinePeriod, setOnlinePeriod] = useState(7);
  const [scenarioTab, setScenarioTab] = useState(0);
  const [onlinePlayersByDay, setOnlinePlayersByDay] = useState({}); // { [date]: [{nickname, uuid}] }
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setLoadingStats(true);
    axios.get('/api/admin/stats')
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
    setLoadingActivity(true);
    axios.get('/api/admin/activity')
      .then(res => {
        const data = res.data;
        setActivity(
          data && Array.isArray(data.labels) && Array.isArray(data.datasets)
            ? data
            : { labels: [], datasets: [] }
        );
      })
      .catch(() => setActivity({ labels: [], datasets: [] }))
      .finally(() => setLoadingActivity(false));
    setLoadingTop(true);
    axios.get('/api/admin/top-players')
      .then(res => setTopPlayers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setTopPlayers([]))
      .finally(() => setLoadingTop(false));
  }, []);

  useEffect(() => {
    // Загрузка статистики по сценариям за 30 дней
    const fetchScenarioStats = async () => {
      setLoadingScenarios(true);
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        const res = await axios.get('/api/admin/match-history', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            limit: 1000,
            offset: 0
          },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const matches = Array.isArray(res.data.matches) ? res.data.matches : [];
        // Группируем по missionName
        const statsMap = {};
        matches.forEach(m => {
          if (!m.missionName) return;
          if (!statsMap[m.missionName]) statsMap[m.missionName] = 0;
          statsMap[m.missionName]++;
        });
        // Преобразуем в массив и сортируем по убыванию
        const statsArr = Object.entries(statsMap).map(([missionName, count]) => ({ missionName, count }));
        statsArr.sort((a, b) => b.count - a.count);
        setScenarioStats(statsArr);
      } catch {
        setScenarioStats([]);
      } finally {
        setLoadingScenarios(false);
      }
    };
    fetchScenarioStats();
  }, []);

  useEffect(() => {
    // Загрузка онлайна по дням
    const fetchOnlineStats = async () => {
      setLoadingOnline(true);
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - onlinePeriod);
        const res = await axios.get('/api/admin/match-history', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            limit: 1000,
            offset: 0
          },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const matches = Array.isArray(res.data.matches) ? res.data.matches : [];
        // Группируем по дате (день) и собираем уникальных игроков
        const dayMap = {};
        const playersMap = {};
        matches.forEach(m => {
          if (!m.date || !Array.isArray(m.players)) return;
          const day = new Date(m.date);
          day.setHours(0,0,0,0);
          const dayStr = day.toISOString().slice(0,10);
          if (!dayMap[dayStr]) dayMap[dayStr] = new Set();
          if (!playersMap[dayStr]) playersMap[dayStr] = {};
          m.players.forEach(p => {
            const uuid = p.playerIdentity || (p.PlayerId ? 'pid_' + p.PlayerId : null);
            if (!uuid) return;
            dayMap[dayStr].add(uuid);
            // Сохраняем никнейм и uuid
            if (!playersMap[dayStr][uuid]) {
              playersMap[dayStr][uuid] = { nickname: p.name || p.username || p.nickname || uuid, uuid };
            }
          });
        });
        // Преобразуем в массив и сортируем по дате (свежие сверху)
        const statsArr = Object.entries(dayMap).map(([date, set]) => ({ date, online: set.size }));
        statsArr.sort((a, b) => b.date.localeCompare(a.date)); // свежие сверху
        setOnlineStats(statsArr);
        setOnlinePlayersByDay(playersMap);
      } catch {
        setOnlineStats([]);
        setOnlinePlayersByDay({});
      } finally {
        setLoadingOnline(false);
      }
    };
    fetchOnlineStats();
  }, [onlinePeriod]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>Дашборд</Typography>
      {/* Карточки статистики */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Пользователи</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {loadingStats ? <CircularProgress size={24} /> : stats?.users ?? '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Новости</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {loadingStats ? <CircularProgress size={24} /> : stats?.news ?? '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Отряды</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {loadingStats ? <CircularProgress size={24} /> : stats?.squads ?? '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Сезоны</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {loadingStats ? <CircularProgress size={24} /> : stats?.seasons ?? '-'}
        </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Статистика по сценариям (30 дней)</Typography>
        <Tabs value={scenarioTab} onChange={(_, v) => setScenarioTab(v)} sx={{ mb: 2 }}>
          <Tab label="Таблица" />
          <Tab label="Line Chart" />
        </Tabs>
        {scenarioTab === 0 && (
          loadingScenarios ? <CircularProgress /> : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Сценарий</TableCell>
                  <TableCell align="right">Матчей</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scenarioStats.length === 0 && (
                  <TableRow><TableCell colSpan={2} align="center">Нет данных</TableCell></TableRow>
                )}
                {scenarioStats.map((row, idx) => (
                  <TableRow key={row.missionName || idx}>
                    <TableCell>{row.missionName}</TableCell>
                    <TableCell align="right">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        )}
        {scenarioTab === 1 && (
          loadingScenarios ? <CircularProgress /> : (
            <Box sx={{ width: '100%', minHeight: 350 }}>
              <LineChart
                xAxis={[{
                  data: scenarioStats.map(row => row.missionName),
                  scaleType: 'point',
                  label: 'Сценарий',
                }]}
                series={[{
                  data: scenarioStats.map(row => row.count),
                  label: 'Матчей',
                  color: '#1976d2',
                }]}
                height={400}
                width={1200}
                margin={{ left: 60, right: 20, top: 40, bottom: 60 }}
                grid={{ vertical: true, horizontal: true }}
              />
            </Box>
          )
        )}
      </Paper>
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Онлайн по дням</Typography>
        <FormControl size="small" sx={{ minWidth: 120, mb: 2 }}>
          <InputLabel id="online-period-label">Период</InputLabel>
          <Select
            labelId="online-period-label"
            value={onlinePeriod}
            label="Период"
            onChange={e => setOnlinePeriod(Number(e.target.value))}
          >
            <MenuItem value={7}>7 дней</MenuItem>
            <MenuItem value={14}>14 дней</MenuItem>
            <MenuItem value={30}>30 дней</MenuItem>
          </Select>
        </FormControl>
        {loadingOnline ? <CircularProgress /> : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Дата</TableCell>
                <TableCell align="right">Онлайн (уникальных игроков)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {onlineStats.length === 0 && (
                <TableRow><TableCell colSpan={2} align="center">Нет данных</TableCell></TableRow>
              )}
              {onlineStats.map((row, idx) => (
                <TableRow key={row.date || idx} hover style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedDay(row.date);
                    setModalOpen(true);
                  }}
                >
                  <TableCell>{row.date}</TableCell>
                  <TableCell align="right">{row.online}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
      {/* Модалка с игроками онлайн за день */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Онлайн за {selectedDay}</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Никнейм</TableCell>
                  <TableCell>UUID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(selectedDay && onlinePlayersByDay[selectedDay]) ?
                  Object.values(onlinePlayersByDay[selectedDay]).map((player, idx) => (
                    <TableRow key={player.uuid || idx}>
                      <TableCell>{player.nickname}</TableCell>
                      <TableCell>{player.uuid}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={2} align="center">Нет данных</TableCell></TableRow>
                  )
                }
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
      </Box>
  );
} 