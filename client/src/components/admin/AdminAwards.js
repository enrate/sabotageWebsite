import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Paper, Grid, Avatar, Tooltip, Tabs, Tab, Autocomplete, CircularProgress, Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, EmojiEvents as AwardIcon, People as PeopleIcon } from '@mui/icons-material';

const emptyAward = { type: '', name: '', description: '', image: '' };

const AdminAwards = () => {
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editAward, setEditAward] = useState(null);
  const [form, setForm] = useState(emptyAward);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('list');
  const [userId, setUserId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userOptions, setUserOptions] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [awardToUser, setAwardToUser] = useState('');
  const [userComment, setUserComment] = useState('');
  const [userAwardResult, setUserAwardResult] = useState(null);
  const [squadId, setSquadId] = useState('');
  const [squadSearch, setSquadSearch] = useState('');
  const [squadOptions, setSquadOptions] = useState([]);
  const [squadLoading, setSquadLoading] = useState(false);
  const [awardToSquad, setAwardToSquad] = useState('');
  const [squadComment, setSquadComment] = useState('');
  const [squadAwardResult, setSquadAwardResult] = useState(null);
  const [recipientsDialog, setRecipientsDialog] = useState({ open: false, award: null, recipients: null, loading: false });

  const fetchAwards = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/awards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAwards(res.data);
    } catch (e) {
      setError('Ошибка загрузки наград');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAwards(); }, []);

  useEffect(() => {
    if (userSearch.length < 2) return;
    setUserLoading(true);
    axios.get(`/api/admin/users?search=${encodeURIComponent(userSearch)}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => setUserOptions(res.data))
      .catch(() => setUserOptions([]))
      .finally(() => setUserLoading(false));
  }, [userSearch]);

  useEffect(() => {
    if (squadSearch.length < 2) return;
    setSquadLoading(true);
    axios.get(`/api/squads?search=${encodeURIComponent(squadSearch)}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => setSquadOptions(res.data))
      .catch(() => setSquadOptions([]))
      .finally(() => setSquadLoading(false));
  }, [squadSearch]);

  useEffect(() => {
    const checkRecipients = async () => {
      const token = localStorage.getItem('token');
      const updated = await Promise.all(awards.map(async a => {
        try {
          const res = await axios.get(`/api/admin/awards/${a.id}/recipients`, { headers: { Authorization: `Bearer ${token}` } });
          return { ...a, _hasRecipients: (res.data.users.length > 0 || res.data.squads.length > 0) };
        } catch {
          return { ...a, _hasRecipients: false };
        }
      }));
      setAwards(updated);
    };
    if (awards.length) checkRecipients();
  }, [awards.length]);

  const handleOpenDialog = (award = null) => {
    setEditAward(award);
    setForm(award ? { ...award } : emptyAward);
    setOpenDialog(true);
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditAward(null);
    setForm(emptyAward);
  };
  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (editAward) {
        await axios.put(`/api/admin/awards/${editAward.id}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/admin/awards', form, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await fetchAwards();
      handleCloseDialog();
    } catch (e) {
      setError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (award) => {
    if (!window.confirm('Удалить награду?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/awards/${award.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchAwards();
    } catch (e) {
      setError('Ошибка удаления');
    }
  };

  const handleGiveAwardToUser = async () => {
    setUserAwardResult(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/awards/give/user', {
        userId,
        awardId: awardToUser,
        comment: userComment
      }, { headers: { Authorization: `Bearer ${token}` } });
      setUserAwardResult({ success: true, message: 'Награда выдана игроку!' });
      setUserId(''); setAwardToUser(''); setUserComment('');
    } catch (e) {
      setUserAwardResult({ success: false, message: 'Ошибка выдачи награды' });
    }
  };

  const handleGiveAwardToSquad = async () => {
    setSquadAwardResult(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/awards/give/squad', {
        squadId,
        awardId: awardToSquad,
        comment: squadComment
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSquadAwardResult({ success: true, message: 'Награда выдана отряду!' });
      setSquadId(''); setAwardToSquad(''); setSquadComment('');
    } catch (e) {
      setSquadAwardResult({ success: false, message: 'Ошибка выдачи награды' });
    }
  };

  const handleShowRecipients = async (award) => {
    setRecipientsDialog({ open: true, award, recipients: null, loading: true });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/admin/awards/${award.id}/recipients`, { headers: { Authorization: `Bearer ${token}` } });
      setRecipientsDialog({ open: true, award, recipients: res.data, loading: false });
    } catch {
      setRecipientsDialog({ open: true, award, recipients: { users: [], squads: [] }, loading: false });
    }
  };

  const handleCloseRecipients = () => setRecipientsDialog({ open: false, award: null, recipients: null, loading: false });

  const handleRevoke = async (type, id) => {
    const token = localStorage.getItem('token');
    if (type === 'user') {
      await axios.delete(`/api/admin/awards/user-award/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    } else {
      await axios.delete(`/api/admin/awards/squad-award/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    }
    await handleShowRecipients(recipientsDialog.award);
    await fetchAwards();
  };

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Список наград" value="list" />
        <Tab label="Выдать игроку" value="user" />
        <Tab label="Выдать отряду" value="squad" />
      </Tabs>
      {tab === 'list' && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AwardIcon sx={{ color: '#ffb347', fontSize: 32, mr: 1 }} />
          <Typography variant="h5" sx={{ color: '#ffb347', fontWeight: 700, flex: 1 }}>
            Управление наградами
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Создать награду
          </Button>
        </Box>
      )}
      {tab === 'list' && loading ? (
        <Typography>Загрузка...</Typography>
      ) : tab === 'list' && error ? (
        <Typography color="error">{error}</Typography>
      ) : tab === 'list' && (
        <Grid container spacing={2}>
          {awards.map(award => (
            <Grid item xs={12} sm={6} md={4} key={award.id}>
              <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }} elevation={4}>
                <Avatar src={award.image} sx={{ bgcolor: '#ffb347', width: 56, height: 56 }}>
                  {!award.image && <AwardIcon />}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ color: '#ffb347', fontWeight: 600 }}>{award.name}</Typography>
                  <Typography variant="body2" sx={{ color: '#fff' }}>{award.type}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{award.description}</Typography>
                </Box>
                <Tooltip title="Редактировать">
                  <IconButton onClick={() => handleOpenDialog(award)}><EditIcon /></IconButton>
                </Tooltip>
                <Tooltip title="Кому выдана">
                  <IconButton onClick={() => handleShowRecipients(award)}><PeopleIcon /></IconButton>
                </Tooltip>
                <Tooltip title="Удалить">
                  <span>
                    <IconButton color="error" onClick={() => handleDelete(award)} disabled={award._hasRecipients}>
                      <DeleteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
      {tab === 'user' && (
        <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Выдать награду игроку</Typography>
          <Autocomplete
            options={userOptions}
            getOptionLabel={u => u.username ? `${u.username} (id:${u.id})` : ''}
            loading={userLoading}
            onInputChange={(_, v) => setUserSearch(v)}
            onChange={(_, v) => setUserId(v ? v.id : '')}
            renderInput={params => <TextField {...params} label="Игрок" fullWidth />}
            value={userOptions.find(u => u.id === userId) || null}
          />
          <TextField
            select
            label="Награда"
            name="awardToUser"
            value={awardToUser}
            onChange={e => setAwardToUser(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            SelectProps={{ native: true }}
          >
            <option value=""></option>
            {awards.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </TextField>
          <TextField
            label="Комментарий (необязательно)"
            value={userComment}
            onChange={e => setUserComment(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={handleGiveAwardToUser}
            disabled={!userId || !awardToUser}
          >
            Выдать
          </Button>
          {userAwardResult && (
            <Alert severity={userAwardResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>{userAwardResult.message}</Alert>
          )}
        </Paper>
      )}
      {tab === 'squad' && (
        <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Выдать награду отряду</Typography>
          <Autocomplete
            options={squadOptions}
            getOptionLabel={s => s.name ? `${s.name} (id:${s.id})` : ''}
            loading={squadLoading}
            onInputChange={(_, v) => setSquadSearch(v)}
            onChange={(_, v) => setSquadId(v ? v.id : '')}
            renderInput={params => <TextField {...params} label="Отряд" fullWidth />}
            value={squadOptions.find(s => s.id === squadId) || null}
          />
          <TextField
            select
            label="Награда"
            name="awardToSquad"
            value={awardToSquad}
            onChange={e => setAwardToSquad(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            SelectProps={{ native: true }}
          >
            <option value=""></option>
            {awards.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </TextField>
          <TextField
            label="Комментарий (необязательно)"
            value={squadComment}
            onChange={e => setSquadComment(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={handleGiveAwardToSquad}
            disabled={!squadId || !awardToSquad}
          >
            Выдать
          </Button>
          {squadAwardResult && (
            <Alert severity={squadAwardResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>{squadAwardResult.message}</Alert>
          )}
        </Paper>
      )}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editAward ? 'Редактировать награду' : 'Создать награду'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Тип (медаль, кубок...)" name="type" value={form.type} onChange={handleChange} fullWidth />
          <TextField label="Название" name="name" value={form.name} onChange={handleChange} fullWidth />
          <TextField label="Описание" name="description" value={form.description} onChange={handleChange} fullWidth multiline minRows={2} />
          <TextField label="URL картинки" name="image" value={form.image} onChange={handleChange} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>{editAward ? 'Сохранить' : 'Создать'}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={recipientsDialog.open} onClose={handleCloseRecipients} maxWidth="md" fullWidth>
        <DialogTitle>Кому выдана награда: {recipientsDialog.award?.name}</DialogTitle>
        <DialogContent>
          {recipientsDialog.loading ? <Typography>Загрузка...</Typography> : (
            <>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Пользователи:</Typography>
              {(!recipientsDialog.recipients?.users?.length) ? <Typography sx={{ mb: 2 }}>Нет</Typography> : (
                <Box sx={{ mb: 2 }}>
                  {recipientsDialog.recipients.users.map(uaw => (
                    <Paper key={uaw.id} sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <span>{uaw.User?.username} (id:{uaw.User?.id})</span>
                      <span>Выдал: {uaw.issuer?.username}</span>
                      <span>Дата: {uaw.issuedAt ? new Date(uaw.issuedAt).toLocaleDateString() : '-'}</span>
                      <Button color="error" size="small" onClick={() => handleRevoke('user', uaw.id)}>Забрать</Button>
                    </Paper>
                  ))}
                </Box>
              )}
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Отряды:</Typography>
              {(!recipientsDialog.recipients?.squads?.length) ? <Typography>Нет</Typography> : (
                <Box>
                  {recipientsDialog.recipients.squads.map(saw => (
                    <Paper key={saw.id} sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <span>{saw.Squad?.name} (id:{saw.Squad?.id})</span>
                      <span>Выдал: {saw.issuer?.username}</span>
                      <span>Дата: {saw.issuedAt ? new Date(saw.issuedAt).toLocaleDateString() : '-'}</span>
                      <Button color="error" size="small" onClick={() => handleRevoke('squad', saw.id)}>Забрать</Button>
                    </Paper>
                  ))}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRecipients}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminAwards; 