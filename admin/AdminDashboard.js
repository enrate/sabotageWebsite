import React, { useState, useEffect } from "react";
import { Box, Typography, List, ListItem, ListItemButton, Divider } from '@mui/material';
import NewsIcon from '@mui/icons-material/Article';
import UsersIcon from '@mui/icons-material/Group';
import AwardIcon from '@mui/icons-material/EmojiEvents';
import SquadIcon from '@mui/icons-material/Groups';
import SeasonIcon from '@mui/icons-material/CalendarMonth';
import AdminNews from './AdminNews';
import AdminAwards from './src/components/AdminAwards';
import AdminUsers from './AdminUsers';
import AdminSquads from './AdminSquads';
import AdminSeasons from './AdminSeasons';
import axios from 'axios';

const sections = [
  { key: 'news', label: 'Новости', icon: <NewsIcon /> },
  { key: 'awards', label: 'Награды', icon: <AwardIcon /> },
  { key: 'users', label: 'Пользователи', icon: <UsersIcon /> },
  { key: 'squads', label: 'Сквады', icon: <SquadIcon /> },
  { key: 'seasons', label: 'Сезоны', icon: <SeasonIcon /> },
];

export default function AdminDashboard() {
  const [section, setSection] = useState('news');
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [errorNews, setErrorNews] = useState(null);

  useEffect(() => {
    if (section === 'news') {
      setLoadingNews(true);
      axios.get('/api/news')
        .then(res => setNews(res.data))
        .catch(() => setErrorNews('Ошибка загрузки новостей'))
        .finally(() => setLoadingNews(false));
    }
  }, [section]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex' }}>
      {/* Боковое меню */}
      <Box sx={{ width: 240, bgcolor: 'background.paper', p: 2, borderRight: '1px solid #222', minHeight: '100vh' }}>
        <Typography variant="h5" sx={{ mb: 3, color: 'secondary.main', fontWeight: 700 }}>
          Админ-панель
        </Typography>
        <List>
          {sections.map(s => (
            <ListItem key={s.key} disablePadding>
              <ListItemButton selected={section === s.key} onClick={() => setSection(s.key)} sx={{ borderRadius: 2, gap: 1 }}>
                {s.icon}
                <Typography sx={{ ml: 1 }}>{s.label}</Typography>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider sx={{ mt: 2 }} />
      </Box>
      {/* Контент */}
      <Box sx={{ flex: 1, p: { xs: 1, md: 4 }, minHeight: '100vh', bgcolor: 'background.default' }}>
        {section === 'news' && (
          loadingNews ? <Typography>Загрузка новостей...</Typography> :
          <AdminNews news={news} setNews={setNews} />
        )}
        {section === 'awards' && <AdminAwards />}
        {section === 'users' && <AdminUsers />}
        {section === 'squads' && <AdminSquads />}
        {section === 'seasons' && <AdminSeasons />}
      </Box>
    </Box>
  );
} 