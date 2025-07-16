import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import MatchHistoryTable from './components/MatchHistoryTable';
import axios from 'axios';

const AdminMatchHistory = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await axios.get('/api/admin/match-history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setMatches(res.data);
    } catch (e) {
      setError('Ошибка загрузки истории матчей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMatches(); }, []);

  return (
    <Box>
      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> :
        <MatchHistoryTable matches={matches} refreshMatches={fetchMatches} />
      }
    </Box>
  );
};

export default AdminMatchHistory; 