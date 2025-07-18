import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import SquadTable from './components/SquadTable';
import axios from 'axios';

const AdminSquads = () => {
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSquads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await axios.get('/api/squads', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSquads(res.data);
    } catch (e) {
      setError('Ошибка загрузки сквадов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSquads(); }, []);

  return (
    <Box>
      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> :
        <SquadTable squads={squads} refreshSquads={fetchSquads} />
      }
    </Box>
  );
};

export default AdminSquads;