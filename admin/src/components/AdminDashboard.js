import React, { useState, useEffect } from "react";
import DashboardLayout from './DashboardLayout';
import { Grid, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import AdminNews from '../AdminNews';
import AdminAwards from '../AdminAwards';
import AdminUsers from '../AdminUsers';
import AdminSquads from '../AdminSquads';
import AdminSeasons from '../AdminSeasons';
import AdminMatchHistory from '../AdminMatchHistory';
import AdminComments from '../AdminComments';
import AdminNotifications from '../AdminNotifications';
import AdminStatistics from '../AdminStatistics';
import AdminSettings from '../AdminSettings';
import AdminLogs from '../AdminLogs';
import axios from 'axios';

export default function AdminDashboard() {
  const [section, setSection] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    // Загрузка статистики для дашборда
    setLoadingStats(true);
    axios.get('/api/admin/stats')
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    if (section === 'news') {
      setLoadingNews(true);
      axios.get('/api/news')
        .then(res => setNews(res.data))
        .catch(() => setNews([]))
        .finally(() => setLoadingNews(false));
    }
  }, [section]);

  return (
    <DashboardLayout section={section} setSection={setSection}>
      {section === 'dashboard' && (
        <>
          <Typography variant="h4" gutterBottom>Общая статистика</Typography>
          {loadingStats ? <CircularProgress /> : (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: '#222', color: '#fff' }}>
                  <CardContent>
                    <Typography variant="h6">Пользователи</Typography>
                    <Typography variant="h4">{stats?.users ?? '-'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: '#222', color: '#fff' }}>
                  <CardContent>
                    <Typography variant="h6">Новости</Typography>
                    <Typography variant="h4">{stats?.news ?? '-'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: '#222', color: '#fff' }}>
                  <CardContent>
                    <Typography variant="h6">Сквады</Typography>
                    <Typography variant="h4">{stats?.squads ?? '-'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: '#222', color: '#fff' }}>
                  <CardContent>
                    <Typography variant="h6">Сезоны</Typography>
                    <Typography variant="h4">{stats?.seasons ?? '-'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </>
      )}
      {section === 'news' && (
        loadingNews ? <Typography>Загрузка новостей...</Typography> :
        <AdminNews news={news} setNews={setNews} />
      )}
      {section === 'awards' && <AdminAwards />}
      {section === 'users' && <AdminUsers />}
      {section === 'squads' && <AdminSquads />}
      {section === 'seasons' && <AdminSeasons />}
      {section === 'matches' && <AdminMatchHistory />}
      {section === 'comments' && <AdminComments />}
      {section === 'notifications' && <AdminNotifications />}
      {section === 'statistics' && <AdminStatistics />}
      {section === 'settings' && <AdminSettings />}
      {section === 'logs' && <AdminLogs />}
    </DashboardLayout>
  );
} 