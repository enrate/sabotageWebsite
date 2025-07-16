import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody, TableContainer } from '@mui/material';
// Для графика можно использовать Chart.js или Recharts, здесь пример с Chart.js
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import axios from 'axios';

const StatisticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        const res = await axios.get('/api/admin/statistics', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setStats(res.data);
      } catch (e) {
        setError('Ошибка загрузки статистики');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!stats) return null;

  return (
    <Box>
      <Typography variant="h4" sx={{ color: '#ffb347', mb: 3 }}>Статистика</Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Пользователей</Typography>
            <Typography variant="h4" color="primary">{stats.totalUsers}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Матчей</Typography>
            <Typography variant="h4" color="primary">{stats.totalMatches}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Сквадов</Typography>
            <Typography variant="h4" color="primary">{stats.totalSquads}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Комментариев</Typography>
            <Typography variant="h4" color="primary">{stats.totalComments}</Typography>
          </Paper>
        </Grid>
      </Grid>
      {/* Пример графика активности */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Активность по дням</Typography>
        <Line
          data={{
            labels: stats.activity?.map(d => d.date),
            datasets: [
              {
                label: 'Новые пользователи',
                data: stats.activity?.map(d => d.newUsers),
                borderColor: '#ffb347',
                backgroundColor: 'rgba(255,179,71,0.2)',
                tension: 0.3
              },
              {
                label: 'Матчи',
                data: stats.activity?.map(d => d.matches),
                borderColor: '#4f8cff',
                backgroundColor: 'rgba(79,140,255,0.1)',
                tension: 0.3
              }
            ]
          }}
          options={{
            responsive: true,
            plugins: { legend: { position: 'top' } }
          }}
        />
      </Paper>
      {/* Пример таблицы топ-игроков */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Топ-10 игроков по очкам</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Игрок</TableCell>
                <TableCell>Очки</TableCell>
                <TableCell>Матчей</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(stats.topPlayers || []).map(player => (
                <TableRow key={player.id}>
                  <TableCell>{player.username}</TableCell>
                  <TableCell>{player.score}</TableCell>
                  <TableCell>{player.matches}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default StatisticsDashboard; 