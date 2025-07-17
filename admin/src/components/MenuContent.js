import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ArticleIcon from '@mui/icons-material/Article';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupIcon from '@mui/icons-material/Group';
import GroupsIcon from '@mui/icons-material/Groups';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CommentIcon from '@mui/icons-material/Comment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import ListAltIcon from '@mui/icons-material/ListAlt';

const tabs = [
  { key: 'dashboard', label: 'Дашборд', icon: <HomeRoundedIcon />, path: '/dashboard' },
  { key: 'news', label: 'Новости', icon: <ArticleIcon />, path: '/news' },
  { key: 'awards', label: 'Награды', icon: <EmojiEventsIcon />, path: '/awards' },
  { key: 'users', label: 'Пользователи', icon: <GroupIcon />, path: '/users' },
  { key: 'squads', label: 'Сквады', icon: <GroupsIcon />, path: '/squads' },
  { key: 'seasons', label: 'Сезоны', icon: <CalendarMonthIcon />, path: '/seasons' },
  { key: 'matches', label: 'Матчи', icon: <AssignmentIcon />, path: '/matches' },
  { key: 'comments', label: 'Комментарии', icon: <CommentIcon />, path: '/comments' },
  { key: 'notifications', label: 'Уведомления', icon: <NotificationsIcon />, path: '/notifications' },
  { key: 'statistics', label: 'Статистика', icon: <BarChartIcon />, path: '/statistics' },
  { key: 'settings', label: 'Настройки', icon: <SettingsIcon />, path: '/settings' },
  { key: 'logs', label: 'Системные логи', icon: <ListAltIcon />, path: '/logs' },
];

export default function MenuContent({ section, navigate }) {
  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>
        {tabs.map((item) => (
          <ListItem key={item.key} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              selected={section === item.key}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
} 