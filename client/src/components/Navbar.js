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
    if (path === '/squads') {
      // Если пользователь на странице своего отряда, не подсвечивать 'Отряды'
      if (currentUser?.squadId && location.pathname === `/squads/${currentUser.squadId}`) {
        return false;
      }
      return location.pathname === '/squads' || location.pathname.startsWith('/squads/');
    }
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
        <Toolbar sx={{ px: { xs: 1, md: 2 }, justifyContent: 'space-between' }}>
          {/* Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
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

          {/* Navigation Links - Centered */}
          <Box sx={{ 
            display: { xs: 'none', md: 'flex' }, 
            alignItems: 'center', 
            gap: 3,
            justifyContent: 'center',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)'
          }}>
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
            {/* Вкладка 'Мой отряд' */}
            {currentUser?.squadId && (
              <Button
                component={Link}
                to={`/squads/${currentUser.squadId}`}
                startIcon={<SquadIcon />}
                sx={{
                  color: location.pathname === `/squads/${currentUser.squadId}` ? '#ffb347' : '#fff',
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    display: location.pathname === `/squads/${currentUser.squadId}` ? 'block' : 'none',
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
                Мой отряд
              </Button>
            )}

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
          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {currentUser ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {/* Уведомления */}
                <IconButton
                  sx={{
                    color: '#ffb347',
                    p: 1.5,
                    borderRadius: '50%',
                    '&:hover': {
                      bgcolor: 'rgba(255, 179, 71, 0.1)'
                    }
                  }}
                  aria-label="notifications"
                  onClick={handleNotifClick}
                >
                  <Badge badgeContent={notifications.length} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
                
                {/* Аватар */}
                <IconButton
                  onClick={handleProfileClick}
                  sx={{
                    p: 1,
                    borderRadius: '50%',
                    '&:hover': {
                      bgcolor: 'rgba(255, 179, 71, 0.1)'
                    }
                  }}
                >
                  <Avatar 
                    src={currentUser.avatar}
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: currentUser.avatar ? 'transparent' : '#ffb347',
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
                      minWidth: 200,
                      bgcolor: 'rgba(0, 0, 0, 0.9)',
                      color: '#fff',
                      borderRadius: 3,
                      boxShadow: '0 6px 24px 0 rgba(255,179,71,0.16), 0 2px 10px rgba(0,0,0,0.14)',
                      border: '2px solid #ffb347',
                      backdropFilter: 'blur(10px)',
                      mt: 0.5,
                      overflow: 'hidden'
                    }
                  }}
                  transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
                >
                  {/* Заголовок */}
                  <Box sx={{ 
                    p: 2, 
                    borderBottom: '1px solid rgba(255, 179, 71, 0.2)',
                    bgcolor: 'rgba(255, 179, 71, 0.05)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#ffb347', fontWeight: 600, textAlign: 'center' }}>
                      Меню
                    </Typography>
                  </Box>
                  
                  {/* Содержимое */}
                  <Box sx={{ p: 1 }}>
                    <Box 
                      onClick={() => handleMenuClick(`/profile/${currentUser.id}`)}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'rgba(255, 179, 71, 0.1)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 2, color: '#ffb347' }} />
                        <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                          Профиль
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box 
                      onClick={() => handleMenuClick('/messages')}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'rgba(255, 179, 71, 0.1)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MailIcon sx={{ mr: 2, color: '#ffb347' }} />
                        <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                          Сообщения
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box 
                      onClick={() => handleMenuClick('/settings')}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'rgba(255, 179, 71, 0.1)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SettingsIcon sx={{ mr: 2, color: '#ffb347' }} />
                        <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                          Настройки
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 1, bgcolor: 'rgba(255, 179, 71, 0.2)' }} />
                    
                    <Box 
                      onClick={handleLogout}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'rgba(244, 67, 54, 0.1)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LogoutIcon sx={{ mr: 2, color: '#f44336' }} />
                        <Typography sx={{ color: '#f44336', fontWeight: 500 }}>
                          Выйти
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Menu>

                <Menu
                  anchorEl={notifAnchorEl}
                  open={notifOpen}
                  onClose={handleNotifClose}
                  disableScrollLock
                  PaperProps={{ 
                    sx: { 
                      minWidth: 320,
                      maxWidth: 400,
                      bgcolor: 'rgba(0, 0, 0, 0.9)',
                      color: '#fff',
                      borderRadius: 3,
                      boxShadow: '0 6px 24px 0 rgba(255,179,71,0.16), 0 2px 10px rgba(0,0,0,0.14)',
                      border: '2px solid #ffb347',
                      backdropFilter: 'blur(10px)',
                      mt: 0.5,
                      overflow: 'hidden'
                    } 
                  }}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                  {/* Заголовок */}
                  <Box sx={{ 
                    p: 2, 
                    borderBottom: '1px solid rgba(255, 179, 71, 0.2)',
                    bgcolor: 'rgba(255, 179, 71, 0.05)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#ffb347', fontWeight: 600, textAlign: 'center' }}>
                      Уведомления
                    </Typography>
                  </Box>
                  
                  {/* Содержимое */}
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {notifications.length === 0 ? (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                          Нет новых уведомлений
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(255, 179, 71, 0.1)' }}>
                          <Button
                            onClick={markAllNotificationsRead}
                            sx={{ 
                              color: '#ffb347', 
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              textTransform: 'none',
                              p: 1,
                              '&:hover': {
                                bgcolor: 'rgba(255, 179, 71, 0.1)'
                              }
                            }}
                            fullWidth
                          >
                            Пометить все как прочитанные
                          </Button>
                        </Box>
                        {notifications.map((notif, index) => (
                          <Box key={notif.id}>
                            {notif.type === 'squad_invite' && notif.data?.inviteId ? (
                              <Box 
                                onClick={() => handleNotifItemClick(notif)}
                                sx={{
                                  p: 2,
                                  cursor: 'pointer',
                                  borderBottom: index < notifications.length - 1 ? '1px solid rgba(255, 179, 71, 0.1)' : 'none',
                                  '&:hover': {
                                    bgcolor: 'rgba(255, 179, 71, 0.1)'
                                  }
                                }}
                              >
                                <Typography sx={{ color: '#ffb347', fontWeight: 600, mb: 1, fontSize: '0.9rem' }}>
                                  Приглашение в отряд
                                </Typography>
                                <Typography sx={{ color: '#fff', fontSize: '0.85rem', mb: 0.5 }}>
                                  {notif.data.squadName ? `Отряд: ${notif.data.squadName}` : `ID отряда: ${notif.data.squadId}`}
                                </Typography>
                                {notif.data.inviterUsername && (
                                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                                    Пригласил: {notif.data.inviterUsername}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Box 
                                onClick={() => handleNotifItemClick(notif)}
                                sx={{
                                  p: 2,
                                  cursor: 'pointer',
                                  borderBottom: index < notifications.length - 1 ? '1px solid rgba(255, 179, 71, 0.1)' : 'none',
                                  '&:hover': {
                                    bgcolor: 'rgba(255, 179, 71, 0.1)'
                                  }
                                }}
                              >
                                <Typography sx={{ color: '#fff', fontSize: '0.9rem' }}>
                                  {notif.message || 'Вам поступило приглашение в отряд'}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        ))}
                      </>
                    )}
                  </Box>
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