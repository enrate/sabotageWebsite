import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import SeasonTable from './components/SeasonTable';
import axios from 'axios';

const AdminSeasons = () => {
  const [seasons, setSeasons] = useState([]);
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSeasons = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const [seasonsRes, awardsRes] = await Promise.all([
        axios.get('/api/admin/seasons', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        axios.get('/api/admin/awards', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      ]);
      setSeasons(seasonsRes.data);
      setAwards(awardsRes.data);
    } catch (e) {
      setError('Ошибка загрузки сезонов или наград');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSeasons(); }, []);

  return (
    <Box>
      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> :
        <SeasonTable seasons={seasons} awards={awards} refreshSeasons={fetchSeasons} />
      }
    </Box>
  );
};

export default AdminSeasons; 