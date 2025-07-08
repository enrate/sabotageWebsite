import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Avatar, 
  Menu, 
  MenuItem, 
  IconButton, 
  useTheme, 
  useMediaQuery,
  Container,
  Divider
} from '@mui/material';
import { 
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Newspaper as NewsIcon,
  Group as SquadIcon,
  Mail as MailIcon,
  Notifications as NotificationsIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import Badge from '@mui/material/Badge';
import axios from 'axios';

const Navbar = ({ onOpenAuthModal, notifications = [], onNotificationClick, markAllNotificationsRead }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  const handleMenuClick = (path) => {
    handleClose();
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Notification state
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const notifOpen = Boolean(notifAnchorEl);
  const handleNotifClick = (event) => {
    setNotifAnchorEl(event.currentTarget);
  };
  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };
  const handleNotifItemClick = async (notif) => {
    if (notif.type === 'squad_invite' && notif.data?.inviteId) {
      // Пометить уведомление как прочитанное
      try {
        await axios.post('/api/notifications/read', { id: notif.id }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } catch {}
      // Переход на /squads с передачей state для открытия таба приглашений
      navigate('/squads', { state: { openInvitesTab: true } });
    handleNotifClose();
      return;
    }
    if (notif && notif.type === 'message' && notif.data?.senderId) {
      navigate(`/messages?user=${notif.data.senderId}`);
      if (onNotificationClick) onNotificationClick(notif.id);
    }
  };

  // --- Добавляем состояния для обработки приглашений ---
  const [inviteActionLoading, setInviteActionLoading] = useState({}); // { [inviteId]: true/false }
  const [inviteActionError, setInviteActionError] = useState({}); // { [inviteId]: string }

  // --- Обработчики принятия/отклонения приглашения ---
  const handleAcceptInvite = async (notif) => {
    if (!notif?.data?.inviteId) return;
    setInviteActionLoading(prev => ({ ...prev, [notif.data.inviteId]: true }));
    setInviteActionError(prev => ({ ...prev, [notif.data.inviteId]: null }));
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/squads/invite/${notif.data.inviteId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onNotificationClick) onNotificationClick(notif.id); // удаляем уведомление
    } catch (err) {
      setInviteActionError(prev => ({ ...prev, [notif.data.inviteId]: err.response?.data?.message || 'Ошибка' }));
    } finally {
      setInviteActionLoading(prev => ({ ...prev, [notif.data.inviteId]: false }));
    }
  };
  const handleDeclineInvite = async (notif) => {
    if (!notif?.data?.inviteId) return;
    setInviteActionLoading(prev => ({ ...prev, [notif.data.inviteId]: true }));
    setInviteActionError(prev => ({ ...prev, [notif.data.inviteId]: null }));
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/squads/invite/${notif.data.inviteId}/decline`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onNotificationClick) onNotificationClick(notif.id); // удаляем уведомление
    } catch (err) {
      setInviteActionError(prev => ({ ...prev, [notif.data.inviteId]: err.response?.data?.message || 'Ошибка' }));
    } finally {
      setInviteActionLoading(prev => ({ ...prev, [notif.data.inviteId]: false }));
    }
  };

  return (
    <AppBar 
      position="sticky" 
      sx={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        animation: 'navbarFadeIn 1.1s cubic-bezier(0.23, 1, 0.32, 1)',
        '@keyframes navbarFadeIn': {
          '0%': { 
            opacity: 0, 
            transform: 'translateY(-30px)' 
          },
          '100%': { 
            opacity: 1, 
            transform: 'translateY(0)' 
          }
        }
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1, md: 2 } }}>
          {/* Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              component="img"
              src="/logo.png"
              alt="Sabotage Group Logo"
              sx={{
                height: 40,
                width: 'auto',
                mr: 1.5,
                filter: 'drop-shadow(0 2px 8px rgba(255,179,71,0.12))',
                transition: 'filter 0.2s',
                '&:hover': {
                  filter: 'drop-shadow(0 2px 8px rgba(255,179,71,0.25))'
                }
              }}
            />
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                color: '#ffb347',
                fontWeight: 'bold',
                letterSpacing: '1.5px',
                textShadow: '0 2px 8px rgba(255,179,71,0.08)',
                transition: 'color 0.2s',
                textDecoration: 'none',
                '&:hover': {
                  color: '#ffd580'
                }
              }}
            >
              Sabotage Group
            </Typography>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3 }}>
            <Button
              component={Link}
              to="/"
              startIcon={<HomeIcon />}
              sx={{
                color: isActive('/') ? '#ffb347' : '#fff',
                textTransform: 'none',
                fontSize: '1.1rem',
                position: 'relative',
                '&::after': {
                  content: '""',
                  display: isActive('/') ? 'block' : 'none',
                  width: '100%',
                  height: 2,
                  background: '#ffb347',
                  position: 'absolute',
                  left: 0,
                  bottom: -2
                },
                '&:hover': {
                  color: '#ffb347'
                }
              }}
            >
              Главная
            </Button>
            
            <Button
              component={Link}
              to="/seasons"
              startIcon={<ArticleIcon />}
              sx={{
                color: isActive('/seasons') ? '#ffb347' : '#fff',
                textTransform: 'none',
                fontSize: '1.1rem',
                position: 'relative',
                '&::after': {
                  content: '""',
                  display: isActive('/seasons') ? 'block' : 'none',
                  width: '100%',
                  height: 2,
                  background: '#ffb347',
                  position: 'absolute',
                  left: 0,
                  bottom: -2
                },
                '&:hover': {
                  color: '#ffb347'
                }
              }}
            >
              Статистика
            </Button>

            <Button
              component={Link}
              to="/squads"
              startIcon={<SquadIcon />}
              sx={{
                color: isActive('/squads') ? '#ffb347' : '#fff',
                textTransform: 'none',
                fontSize: '1.1rem',
                position: 'relative',
                '&::after': {
                  content: '""',
                  display: isActive('/squads') ? 'block' : 'none',
                  width: '100%',
                  height: 2,
                  background: '#ffb347',
                  position: 'absolute',
                  left: 0,
                  bottom: -2
                },
                '&:hover': {
                  color: '#ffb347'
                }
              }}
            >
              Отряды
            </Button>

            {currentUser?.role === 'admin' && (
              <Button
                component={Link}
                to="/admin"
                startIcon={<AdminIcon />}
                sx={{
                  color: isActive('/admin') ? '#ffb347' : '#fff',
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    display: isActive('/admin') ? 'block' : 'none',
                    width: '100%',
                    height: 2,
                    background: '#ffb347',
                    position: 'absolute',
                    left: 0,
                    bottom: -2
                  },
                  '&:hover': {
                    color: '#ffb347'
                  }
                }}
              >
                Админка
              </Button>
            )}
          </Box>

          {/* User Menu / Login Button */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {currentUser ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#ffd580',
                    mr: 2,
                    display: { xs: 'none', sm: 'block' },
                    textShadow: '0 1px 4px rgba(255,213,128,0.08)'
                  }}
                >
                  {currentUser.username}
                </Typography>
                {/* Notification Icon */}
                <IconButton
                  sx={{
                    color: '#ffb347',
                    mr: 1,
                    position: 'relative',
                  }}
                  aria-label="notifications"
                  onClick={handleNotifClick}
                >
                  <Badge badgeContent={notifications.length} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
                
                <IconButton
                  onClick={handleProfileClick}
                  sx={{
                    backgroundColor: '#222',
                    borderRadius: '50%',
                    p: 1,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                    transition: 'background 0.13s cubic-bezier(0.4,0,0.2,1), box-shadow 0.13s cubic-bezier(0.4,0,0.2,1)',
                    '&:hover': {
                      backgroundColor: '#23242a',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.18)'
                    }
                  }}
                >
                  <Avatar 
                    src={currentUser.avatar}
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: currentUser.avatar ? 'transparent' : '#333',
                    }}
                  >
                    {!currentUser.avatar && <PersonIcon />}
                  </Avatar>
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  disableScrollLock
                  PaperProps={{
                    sx: {
                      backgroundColor: '#23242a',
                      borderRadius: 2,
                      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                      border: '1px solid #292a2f',
                      mt: 1
                    }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem onClick={() => handleMenuClick(`/profile/${currentUser.id}`)}>
                    <PersonIcon sx={{ mr: 1 }} />
                    Профиль
                  </MenuItem>
                  <MenuItem onClick={() => handleMenuClick('/messages')}>
                    <MailIcon sx={{ mr: 1 }} />
                    Сообщения
                  </MenuItem>
                  <MenuItem onClick={() => handleMenuClick('/settings')}>
                    <SettingsIcon sx={{ mr: 1 }} />
                    Настройки
                  </MenuItem>
                  <Divider sx={{ my: 1 }} />
                  <MenuItem onClick={handleLogout} sx={{ color: '#ff4d4f' }}>
                    <LogoutIcon sx={{ mr: 1 }} />
                    Выйти
                  </MenuItem>
                </Menu>

                <Menu
                  anchorEl={notifAnchorEl}
                  open={notifOpen}
                  onClose={handleNotifClose}
                  disableScrollLock
                  PaperProps={{ sx: { minWidth: 260, bgcolor: '#23242a', color: '#fff' } }}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  {notifications.length === 0 ? (
                    <MenuItem disabled>Нет новых уведомлений</MenuItem>
                  ) : <>
                    <MenuItem onClick={markAllNotificationsRead} sx={{ color: '#ffb347', fontWeight: 600 }}>Пометить все как прочитанные</MenuItem>
                    {notifications.map((notif) => (
                      notif.type === 'squad_invite' && notif.data?.inviteId ? (
                        <MenuItem key={notif.id} onClick={() => handleNotifItemClick(notif)} style={{ whiteSpace: 'normal', alignItems: 'flex-start', flexDirection: 'column' }}>
                          <div style={{ marginBottom: 6 }}>
                            <b>Приглашение в отряд</b>
                            <br />
                            {notif.data.squadName ? `Отряд: ${notif.data.squadName}` : `ID отряда: ${notif.data.squadId}`}
                            <br />
                            {notif.data.inviterUsername ? `Пригласил: ${notif.data.inviterUsername}` : ''}
                          </div>
                        </MenuItem>
                      ) : (
                        <MenuItem key={notif.id} onClick={() => handleNotifItemClick(notif)}>
                          {notif.message || 'Вам поступило приглашение в отряд'}
                        </MenuItem>
                      )
                    ))}
                  </>}
                </Menu>
              </Box>
            ) : (
              <Button
                onClick={onOpenAuthModal}
                sx={{
                  color: '#ffb347',
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  textDecoration: 'underline',
                  '&:hover': {
                    color: '#ffd580'
                  }
                }}
              >
                Войти
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;