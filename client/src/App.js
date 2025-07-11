import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import NewsPage from './pages/NewsPage';
import SquadPage from './pages/SquadPage';
import SquadDetailPage from './pages/SquadDetailPage';
import AdminPage from './pages/AdminPage';
import PrivateRoute from './components/PrivateRoute';
import AuthModal from './components/AuthModal';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MessagesPage from './pages/MessagesPage';
import theme from './theme';
import './App.css';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import SeasonsPage from './pages/SeasonsPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

console.log('App rendered');

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const location = window.location;
  const [activeChatUserId, setActiveChatUserId] = useState(null);
  // --- Snackbar для уведомлений ---
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const handleShowSnackbar = (message) => {
    setSnackbar({ open: true, message });
  };
  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: '' });
  };

  // Загрузка уведомлений с сервера при старте
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data);
      } catch (e) {
        setNotifications([]);
      } finally {
        setNotificationsLoaded(true);
      }
    };
    fetchNotifications();
  }, []);

  // Удалить уведомление
  const handleNotificationClick = async notifId => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/notifications/${notifId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch {}
  };

  // Пометить все как прочитанные
  const markAllNotificationsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/notifications/read', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  // Глобальный обработчик новых сообщений для уведомлений
  const handleGlobalNewMessage = async msg => {
    const params = new URLSearchParams(window.location.search);
    const isOnMessages = window.location.pathname === '/messages';
    const openedUserId = params.get('user');
    // Проверяем, есть ли уже уведомление от этого пользователя
    const alreadyExists = notifications.some(n => n.type === 'message' && n.data?.senderId === msg.senderId && !n.isRead);
    if ((!isOnMessages || openedUserId != msg.senderId) && !alreadyExists) {
      // Получить актуальные уведомления с сервера (или добавить вручную)
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data);
      } catch {}
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider onNewMessage={handleGlobalNewMessage}>
        <Router>
          <div className="app-container">
              <Navbar onOpenAuthModal={() => setShowAuthModal(true)} notifications={notifications.filter(n => !n.isRead)} onNotificationClick={handleNotificationClick} markAllNotificationsRead={markAllNotificationsRead} />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/news/:id" element={<NewsPage />} />
                <Route path="/squads" element={<SquadPage />} />
                <Route path="/squads/:id" element={<SquadDetailPage />} />
                <Route 
                  path="/admin" 
                  element={
                    <PrivateRoute adminOnly>
                      <AdminPage />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/profile/:id" 
                  element={
                    <PrivateRoute>
                      <ProfilePage />
                    </PrivateRoute>
                  }
                />
                  <Route 
                    path="/settings" 
                    element={
                      <PrivateRoute>
                        <SettingsPage />
                      </PrivateRoute>
                    }
                  />
                  <Route 
                    path="/messages" 
                    element={
                      <PrivateRoute>
                        <MessagesPage />
                      </PrivateRoute>
                    }
                  />
                                  <Route 
                  path="/seasons" 
                  element={<SeasonsPage />} 
                />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
              </Routes>
            </main>
            <Footer />
            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onShowSnackbar={handleShowSnackbar} />}
            <Snackbar
              open={snackbar.open}
              autoHideDuration={7000}
              onClose={handleCloseSnackbar}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
              <MuiAlert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                {snackbar.message}
              </MuiAlert>
            </Snackbar>
          </div>
        </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;