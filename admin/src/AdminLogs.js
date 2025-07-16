import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import LogsTable from './components/LogsTable';
import axios from 'axios';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await axios.get('/api/admin/logs', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setLogs(res.data);
    } catch (e) {
      setError('Ошибка загрузки логов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <Box>
      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> :
        <LogsTable logs={logs} />
      }
    </Box>
  );
};

export default AdminLogs; 