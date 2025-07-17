import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';

export default function AppNavbar() {
  // Можно добавить дополнительные элементы (поиск, уведомления, профиль)
  return (
    <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'background.paper', color: 'text.primary', boxShadow: '0 2px 8px rgba(16,24,40,0.08)' }}>
      <Toolbar sx={{ minHeight: 64 }}>
        <IconButton color="inherit" edge="start" sx={{ mr: 2, display: { sm: 'none' } }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 1 }}>
          Sabotage Admin
        </Typography>
      </Toolbar>
    </AppBar>
  );
} 