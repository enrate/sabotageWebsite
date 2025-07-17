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
  { key: 'dashboard', label: 'Дашборд', icon: <HomeRoundedIcon /> },
  { key: 'news', label: 'Новости', icon: <ArticleIcon /> },
  { key: 'awards', label: 'Награды', icon: <EmojiEventsIcon /> },
  { key: 'users', label: 'Пользователи', icon: <GroupIcon /> },
  { key: 'squads', label: 'Сквады', icon: <GroupsIcon /> },
  { key: 'seasons', label: 'Сезоны', icon: <CalendarMonthIcon /> },
  { key: 'matches', label: 'Матчи', icon: <AssignmentIcon /> },
  { key: 'comments', label: 'Комментарии', icon: <CommentIcon /> },
  { key: 'notifications', label: 'Уведомления', icon: <NotificationsIcon /> },
  { key: 'statistics', label: 'Статистика', icon: <BarChartIcon /> },
  { key: 'settings', label: 'Настройки', icon: <SettingsIcon /> },
  { key: 'logs', label: 'Системные логи', icon: <ListAltIcon /> },
];

export default function MenuContent({ section, setSection }) {
  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>
        {tabs.map((item) => (
          <ListItem key={item.key} disablePadding sx={{ display: 'block' }}>
            <ListItemButton selected={section === item.key} onClick={() => setSection(item.key)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
} 