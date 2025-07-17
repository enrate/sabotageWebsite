import { Table, TableHead, TableRow, TableCell, TableBody, Paper, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Typography, CircularProgress } from '@mui/material';

const AdminDashboard = () => {
  const [scenarioStats, setScenarioStats] = useState([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [onlineStats, setOnlineStats] = useState([]);
  const [loadingOnline, setLoadingOnline] = useState(true);
  const [onlinePeriod, setOnlinePeriod] = useState(7);

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
        // Группируем по дате (день) и считаем уникальных игроков
        const dayMap = {};
        matches.forEach(m => {
          if (!m.date || !Array.isArray(m.players)) return;
          const day = new Date(m.date);
          day.setHours(0,0,0,0);
          const dayStr = day.toISOString().slice(0,10);
          if (!dayMap[dayStr]) dayMap[dayStr] = new Set();
          m.players.forEach(p => {
            if (p.playerIdentity) dayMap[dayStr].add(p.playerIdentity);
            else if (p.PlayerId) dayMap[dayStr].add('pid_' + p.PlayerId);
          });
        });
        // Преобразуем в массив и сортируем по дате
        const statsArr = Object.entries(dayMap).map(([date, set]) => ({ date, online: set.size }));
        statsArr.sort((a, b) => a.date.localeCompare(b.date));
        setOnlineStats(statsArr);
      } catch {
        setOnlineStats([]);
      } finally {
        setLoadingOnline(false);
      }
    };
    fetchOnlineStats();
  }, [onlinePeriod]);

  return (
    <div>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>Админ-панель</Typography>
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Статистика по сценариям (30 дней)</Typography>
        {loadingScenarios ? <CircularProgress /> : (
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
                <TableRow key={row.date || idx}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell align="right">{row.online}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </div>
  );
};

export default AdminDashboard; 