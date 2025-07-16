import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import NotificationsTable from './components/NotificationsTable';
import axios from 'axios';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await axios.get('/api/admin/notifications', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setNotifications(res.data);
    } catch (e) {
      setError('Ошибка загрузки уведомлений');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  return (
    <Box>
      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> :
        <NotificationsTable notifications={notifications} refreshNotifications={fetchNotifications} />
      }
    </Box>
  );
};

export default AdminNotifications; 