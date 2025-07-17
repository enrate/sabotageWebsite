import React, { useEffect, useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper, Grid, Alert, CircularProgress, Autocomplete, TextField, Button, Snackbar, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';
import AwardTable from './components/AwardTable';
import axios from 'axios';

const AdminAwards = () => {
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('list');
  const [recipientsDialog, setRecipientsDialog] = useState({ open: false, award: null, recipients: null, loading: false });
  const [users, setUsers] = useState([]);
  const [squads, setSquads] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [selectedAward, setSelectedAward] = useState(null);
  const [comment, setComment] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSquads, setLoadingSquads] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [recipientsTab, setRecipientsTab] = useState('users');

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

  // Загрузка пользователей для выдачи награды
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await axios.get('/api/admin/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setUsers(res.data);
    } catch (e) {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };
  // Загрузка отрядов для выдачи награды
  const fetchSquads = async () => {
    setLoadingSquads(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await axios.get('/api/admin/squads', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSquads(res.data);
    } catch (e) {
      setSquads([]);
    } finally {
      setLoadingSquads(false);
    }
  };
  useEffect(() => {
    if (tab === 'user') fetchUsers();
    if (tab === 'squad') fetchSquads();
  }, [tab]);

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

  // Выдача награды пользователю
  const handleGiveAwardToUser = async () => {
    if (!selectedUser || !selectedAward) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      await axios.post('/api/admin/awards/give/user', {
        userId: selectedUser.id,
        awardId: selectedAward.id,
        comment
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSnackbar({ open: true, message: 'Награда выдана игроку', severity: 'success' });
      setSelectedUser(null); setSelectedAward(null); setComment('');
      fetchAwards();
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.error || 'Ошибка при выдаче награды', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };
  // Выдача награды отряду
  const handleGiveAwardToSquad = async () => {
    if (!selectedSquad || !selectedAward) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      await axios.post('/api/admin/awards/give/squad', {
        squadId: selectedSquad.id,
        awardId: selectedAward.id,
        comment
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSnackbar({ open: true, message: 'Награда выдана отряду', severity: 'success' });
      setSelectedSquad(null); setSelectedAward(null); setComment('');
      fetchAwards();
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.error || 'Ошибка при выдаче награды', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

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
      {tab === 'user' && (
        <Paper sx={{ p: 3, mb: 2, maxWidth: 500 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Выдача награды игроку</Typography>
          <Autocomplete
            options={users}
            getOptionLabel={u => u.username || ''}
            value={selectedUser}
            onChange={(_, v) => setSelectedUser(v)}
            loading={loadingUsers}
            renderInput={params => <TextField {...params} label="Игрок" margin="normal" />}
            sx={{ mb: 2 }}
          />
          <Autocomplete
            options={awards}
            getOptionLabel={a => a.name || ''}
            value={selectedAward}
            onChange={(_, v) => setSelectedAward(v)}
            renderInput={params => <TextField {...params} label="Награда" margin="normal" />}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Комментарий (необязательно)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="warning" onClick={handleGiveAwardToUser} disabled={saving || !selectedUser || !selectedAward}>
            {saving ? 'Сохранение...' : 'Выдать награду'}
          </Button>
        </Paper>
      )}
      {tab === 'squad' && (
        <Paper sx={{ p: 3, mb: 2, maxWidth: 500 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Выдача награды отряду</Typography>
          <Autocomplete
            options={squads}
            getOptionLabel={s => s.name || ''}
            value={selectedSquad}
            onChange={(_, v) => setSelectedSquad(v)}
            loading={loadingSquads}
            renderInput={params => <TextField {...params} label="Отряд" margin="normal" />}
            sx={{ mb: 2 }}
          />
          <Autocomplete
            options={awards}
            getOptionLabel={a => a.name || ''}
            value={selectedAward}
            onChange={(_, v) => setSelectedAward(v)}
            renderInput={params => <TextField {...params} label="Награда" margin="normal" />}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Комментарий (необязательно)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="warning" onClick={handleGiveAwardToSquad} disabled={saving || !selectedSquad || !selectedAward}>
            {saving ? 'Сохранение...' : 'Выдать награду'}
          </Button>
        </Paper>
      )}
      {/* Диалог получателей награды */}
      <Dialog open={recipientsDialog.open} onClose={handleCloseRecipients} maxWidth="sm" fullWidth>
        <DialogTitle>Получатели награды: {recipientsDialog.award?.name}</DialogTitle>
        <DialogContent>
          <Tabs value={recipientsTab} onChange={(_, v) => setRecipientsTab(v)} sx={{ mb: 2 }}>
            <Tab label="Игроки" value="users" />
            <Tab label="Отряды" value="squads" />
          </Tabs>
          {recipientsDialog.loading ? <CircularProgress /> : (
            recipientsTab === 'users' ? (
              <List>
                {(recipientsDialog.recipients?.users || []).map(u => (
                  <ListItem key={u.id}>
                    <ListItemAvatar><Avatar src={u.avatar} /></ListItemAvatar>
                    <ListItemText primary={u.username} secondary={u.issuedAt ? `Выдано: ${new Date(u.issuedAt).toLocaleString()}` : ''} />
                  </ListItem>
                ))}
                {(!recipientsDialog.recipients?.users || recipientsDialog.recipients.users.length === 0) && <Typography sx={{ p: 2 }}>Нет получателей</Typography>}
              </List>
            ) : (
              <List>
                {(recipientsDialog.recipients?.squads || []).map(sq => (
                  <ListItem key={sq.id}>
                    <ListItemAvatar><Avatar src={sq.logo} /></ListItemAvatar>
                    <ListItemText primary={sq.name} secondary={sq.issuedAt ? `Выдано: ${new Date(sq.issuedAt).toLocaleString()}${sq.comment ? ' — ' + sq.comment : ''}` : ''} />
                  </ListItem>
                ))}
                {(!recipientsDialog.recipients?.squads || recipientsDialog.recipients.squads.length === 0) && <Typography sx={{ p: 2 }}>Нет отрядов-получателей</Typography>}
              </List>
            )
          )}
        </DialogContent>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminAwards; 