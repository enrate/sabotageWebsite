import React, { useState, useEffect } from "react";
import Sheet from '@mui/joy/Sheet';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import Divider from '@mui/joy/Divider';
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
    <Sheet sx={{ minHeight: '100vh', bgcolor: 'background.body', display: 'flex' }}>
      {/* Боковое меню */}
      <Box sx={{ width: 240, bgcolor: 'background.level1', p: 2, borderRight: '1px solid #222', minHeight: '100vh' }}>
        <Typography level="h4" sx={{ mb: 3, color: '#ffb347', fontWeight: 700 }}>
          Админ-панель
        </Typography>
        <List>
          {sections.map(s => (
            <ListItem key={s.key}>
              <ListItemButton selected={section === s.key} onClick={() => setSection(s.key)}>
                <ListItemDecorator>{s.icon}</ListItemDecorator>
                {s.label}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      {/* Контент */}
      <Box sx={{ flex: 1, p: { xs: 1, md: 4 }, minHeight: '100vh', bgcolor: 'background.body' }}>
        {section === 'news' && (
          loadingNews ? <Typography>Загрузка новостей...</Typography> :
          <AdminNews news={news} setNews={setNews} />
        )}
        {section === 'awards' && <AdminAwards />}
        {section === 'users' && <AdminUsers />}
        {section === 'squads' && <AdminSquads />}
        {section === 'seasons' && <AdminSeasons />}
      </Box>
    </Sheet>
  );
} 