import React from 'react';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, AppBar, Toolbar, Typography, CssBaseline, Divider, IconButton } from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import GroupIcon from '@mui/icons-material/Group';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MenuIcon from '@mui/icons-material/Menu';

const drawerWidth = 220;

const sections = [
  { key: 'dashboard', label: 'Дашборд', icon: <ArticleIcon /> },
  { key: 'news', label: 'Новости', icon: <ArticleIcon /> },
  { key: 'awards', label: 'Награды', icon: <EmojiEventsIcon /> },
  { key: 'users', label: 'Пользователи', icon: <GroupIcon /> },
  { key: 'squads', label: 'Сквады', icon: <GroupsIcon /> },
  { key: 'seasons', label: 'Сезоны', icon: <CalendarMonthIcon /> },
  { key: 'matches', label: 'Матчи', icon: <ArticleIcon /> },
  { key: 'comments', label: 'Комментарии', icon: <ArticleIcon /> },
  { key: 'notifications', label: 'Уведомления', icon: <ArticleIcon /> },
  { key: 'statistics', label: 'Статистика', icon: <ArticleIcon /> },
  { key: 'settings', label: 'Настройки', icon: <ArticleIcon /> },
  { key: 'logs', label: 'Системные логи', icon: <ArticleIcon /> },
];

export default function DashboardLayout({ section, setSection, children }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap sx={{ fontWeight: 700, color: '#ffb347' }}>
          Админ-панель
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {sections.map((s) => (
          <ListItem button key={s.key} selected={section === s.key} onClick={() => setSection(s.key)}>
            <ListItemIcon>{s.icon}</ListItemIcon>
            <ListItemText primary={s.label} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#222' }}>
        <Toolbar>
          <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Sabotage Admin
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="sidebar">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
} 