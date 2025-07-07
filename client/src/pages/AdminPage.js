import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AdminNews from '../components/admin/AdminNews';
import AdminSquads from '../components/admin/AdminSquads';
import AdminUsers from '../components/admin/AdminUsers';
import Loader from '../components/Loader';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Article as NewsIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  EmojiEvents as EmojiEventsIcon,
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import AdminAwards from '../components/admin/AdminAwards';
import AdminSeasons from '../components/admin/AdminSeasons';

const AdminPage = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('news');
  const [news, setNews] = useState([]);
  const [squads, setSquads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      const fetchData = async () => {
        try {
          const token = localStorage.getItem('token');
          const [newsRes, squadsRes, usersRes] = await Promise.all([
            axios.get('/api/news'),
            axios.get('/api/squads'),
            axios.get('/api/admin/users', {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
          ]);
          setNews(newsRes.data);
          setSquads(squadsRes.data);
          setUsers(usersRes.data);
          setLoading(false);
        } catch (err) {
          console.error('Ошибка загрузки данных:', err);
          setError('Ошибка загрузки данных');
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [currentUser]);

  if (!currentUser || currentUser.role !== 'admin') {
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
          maxWidth="md" 
          sx={{ 
            position: 'relative', 
            zIndex: 1,
            py: 8,
            textAlign: 'center'
          }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 4,
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 179, 71, 0.2)'
            }}
          >
            <AdminIcon sx={{ fontSize: 64, color: '#f44336', mb: 2 }} />
            <Typography variant="h4" sx={{ color: '#f44336', mb: 2 }}>
              Доступ запрещен
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              У вас нет прав для просмотра этой страницы.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

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
          py: 4
        }}
      >
        {/* Заголовок */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography 
            variant="h3" 
            sx={{ 
              color: '#ffb347', 
              fontWeight: 700, 
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2
            }}
          >
            <AdminIcon sx={{ fontSize: 40 }} />
            Административная панель
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Управление контентом и отрядами
          </Typography>
        </Box>

        {/* Вкладки */}
        <Paper
          elevation={8}
          sx={{
            mb: 4,
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 179, 71, 0.2)'
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#ffb347',
                height: 3
              },
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '1rem',
                fontWeight: 500,
                minHeight: 64,
                '&.Mui-selected': {
                  color: '#ffb347',
                  fontWeight: 600
                }
              }
            }}
          >
            <Tab 
              label="Управление новостями" 
              value="news"
              icon={<NewsIcon />}
            />
            <Tab 
              label="Управление отрядами" 
              value="squads"
              icon={<GroupIcon />}
            />
            <Tab 
              label="Управление пользователями" 
              value="users"
              icon={<PersonIcon />}
            />
            <Tab 
              label="Управление наградами" 
              value="awards"
              icon={<EmojiEventsIcon />}
            />
            <Tab 
              label="Управление сезонами" 
              value="seasons"
              icon={<CalendarMonthIcon />}
            />
          </Tabs>
        </Paper>

        {/* Ошибки */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Контент */}
        <Paper
          elevation={8}
          sx={{
            p: 4,
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 179, 71, 0.2)',
            minHeight: 600
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Loader />
            </Box>
          ) : (
            <Box>
              {activeTab === 'news' && (
                <AdminNews news={news} setNews={setNews} />
              )}
              {activeTab === 'squads' && (
                <AdminSquads squads={squads} setSquads={setSquads} />
              )}
              {activeTab === 'users' && (
                <AdminUsers users={users} setUsers={setUsers} />
              )}
              {activeTab === 'awards' && (
                <AdminAwards />
              )}
              {activeTab === 'seasons' && (
                <AdminSeasons />
              )}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminPage;