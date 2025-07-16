import React, { useEffect, useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper, Grid, Alert, CircularProgress } from '@mui/material';
import AwardTable from './components/AwardTable';
import axios from 'axios';

const AdminAwards = () => {
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('list');
  const [recipientsDialog, setRecipientsDialog] = useState({ open: false, award: null, recipients: null, loading: false });

  const fetchAwards = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await axios.get('/api/admin/awards', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setAwards(res.data);
    } catch (e) {
      setError('Ошибка загрузки наград');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAwards(); }, []);

  // Просмотр получателей награды
  const handleShowRecipients = async (award) => {
    setRecipientsDialog({ open: true, award, recipients: null, loading: true });
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await axios.get(`/api/admin/awards/${award.id}/recipients`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setRecipientsDialog({ open: true, award, recipients: res.data, loading: false });
    } catch {
      setRecipientsDialog({ open: true, award, recipients: { users: [], squads: [] }, loading: false });
    }
  };
  const handleCloseRecipients = () => setRecipientsDialog({ open: false, award: null, recipients: null, loading: false });

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Список наград" value="list" />
        <Tab label="Выдать игроку" value="user" />
        <Tab label="Выдать отряду" value="squad" />
      </Tabs>
      {tab === 'list' && (
        loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> :
        <AwardTable awards={awards} refreshAwards={fetchAwards} onShowRecipients={handleShowRecipients} />
      )}
      {/* TODO: реализовать современные формы выдачи игроку/отряду */}
      {tab === 'user' && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6">Выдача награды игроку — в разработке</Typography>
        </Paper>
      )}
      {tab === 'squad' && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6">Выдача награды отряду — в разработке</Typography>
        </Paper>
      )}
      {/* Диалог получателей награды */}
      {/* TODO: реализовать современный диалог для просмотра получателей */}
    </Box>
  );
};

export default AdminAwards; 