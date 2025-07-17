import React from 'react';
import {
  Box, Drawer, List, ListItem, ListItemIcon, ListItemText, AppBar, Toolbar, Typography, CssBaseline, Divider, IconButton, Avatar, InputBase, Tooltip, Badge, Menu, MenuItem
} from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import GroupIcon from '@mui/icons-material/Group';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';

const drawerWidth = 240;

const sections = [
  { key: 'dashboard', label: 'Дашборд', icon: <HomeIcon /> },
  { key: 'news', label: 'Новости', icon: <ArticleIcon /> },
  { key: 'awards', label: 'Награды', icon: <EmojiEventsIcon /> },
  { key: 'users', label: 'Пользователи', icon: <GroupIcon /> },
  { key: 'squads', label: 'Сквады', icon: <GroupsIcon /> },
  { key: 'seasons', label: 'Сезоны', icon: <CalendarMonthIcon /> },
  { key: 'matches', label: 'Матчи', icon: <ArticleIcon /> },
  { key: 'comments', label: 'Комментарии', icon: <ArticleIcon /> },
  { key: 'notifications', label: 'Уведомления', icon: <NotificationsIcon /> },
  { key: 'statistics', label: 'Статистика', icon: <ArticleIcon /> },
  { key: 'settings', label: 'Настройки', icon: <SettingsIcon /> },
  { key: 'logs', label: 'Системные логи', icon: <ArticleIcon /> },
];

export default function DashboardLayout({ section, setSection, children }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  // TODO: заменить на реальные данные пользователя
  const user = {
    name: 'Админ',
    email: 'admin@sabotage.games',
    avatar: '',
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Toolbar sx={{ minHeight: 64, px: 2 }}>
        <Typography variant="h6" noWrap sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1 }}>
          Sabotage Admin
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ px: 2, py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'background.paper', borderRadius: 2, px: 1 }}>
          <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          <InputBase placeholder="Поиск..." sx={{ color: 'text.primary', width: '100%' }} />
        </Box>
      </Box>
      <List sx={{ flex: 1 }}>
        {sections.map((s) => (
          <ListItem button key={s.key} selected={section === s.key} onClick={() => setSection(s.key)} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <ListItemIcon sx={{ color: section === s.key ? 'primary.main' : 'text.secondary' }}>{s.icon}</ListItemIcon>
            <ListItemText primary={s.label} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar src={user.avatar} alt={user.name} sx={{ width: 36, height: 36 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>{user.name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{user.email}</Typography>
        </Box>
        <Tooltip title="Выйти">
          <IconButton color="inherit" size="small">
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'background.paper', color: 'text.primary', boxShadow: '0 2px 8px rgba(16,24,40,0.08)' }}>
        <Toolbar sx={{ minHeight: 64 }}>
          <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 1 }}>
            {sections.find(s => s.key === section)?.label || 'Панель'}
          </Typography>
          <Tooltip title="Уведомления">
            <IconButton color="inherit">
              <Badge badgeContent={4} color="primary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Профиль">
            <IconButton color="inherit" onClick={handleProfileMenu} sx={{ ml: 1 }}>
              <Avatar src={user.avatar} alt={user.name} sx={{ width: 32, height: 32 }} />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={open} onClose={handleCloseMenu} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
            <MenuItem onClick={handleCloseMenu}>Профиль</MenuItem>
            <MenuItem onClick={handleCloseMenu}>Выйти</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
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
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 3 }, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
        {children}
      </Box>
    </Box>
  );
} 