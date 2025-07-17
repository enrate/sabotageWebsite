import React, { useState, useEffect } from "react";
import { Grid, Card, CardContent, Typography, CircularProgress, Box, Paper } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activity, setActivity] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [topPlayers, setTopPlayers] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);

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
              <Typography variant="subtitle2" color="text.secondary">Сквады</Typography>
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
      {/* График активности */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Активность пользователей</Typography>
        {loadingActivity ? <CircularProgress /> : activity && (
          <Bar
            data={{
              labels: Array.isArray(activity?.labels) ? activity.labels : [],
              datasets: Array.isArray(activity?.datasets) ? activity.datasets : [],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false },
              },
              scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#b8c5d6' } },
                y: { grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#b8c5d6' } },
              },
            }}
            height={220}
          />
        )}
      </Paper>
      {/* Таблица топ-игроков */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Топ-игроки</Typography>
        {loadingTop ? <CircularProgress /> : (
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="thead">
              <Box component="tr" sx={{ bgcolor: 'background.paper' }}>
                <Box component="th" sx={{ textAlign: 'left', py: 1, px: 2, color: 'text.secondary', fontWeight: 700 }}>#</Box>
                <Box component="th" sx={{ textAlign: 'left', py: 1, px: 2, color: 'text.secondary', fontWeight: 700 }}>Игрок</Box>
                <Box component="th" sx={{ textAlign: 'right', py: 1, px: 2, color: 'text.secondary', fontWeight: 700 }}>Очки</Box>
              </Box>
            </Box>
            <Box component="tbody">
              {(Array.isArray(topPlayers) ? topPlayers : []).map((p, idx) => (
                <Box component="tr" key={p.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box component="td" sx={{ py: 1, px: 2 }}>{idx + 1}</Box>
                  <Box component="td" sx={{ py: 1, px: 2 }}>{p.username}</Box>
                  <Box component="td" sx={{ py: 1, px: 2, textAlign: 'right', fontWeight: 600 }}>{p.score}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
} 