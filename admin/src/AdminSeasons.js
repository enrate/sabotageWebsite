import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Paper, Grid, Tooltip, MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, CalendarMonth as CalendarIcon, EmojiEvents as AwardIcon } from '@mui/icons-material';

const emptySeason = { name: '', startDate: '', endDate: '', trophy1Id: '', trophy2Id: '', trophy3Id: '' };

const AdminSeasons = () => {
  const [seasons, setSeasons] = useState([]);
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editSeason, setEditSeason] = useState(null);
  const [form, setForm] = useState(emptySeason);
  const [saving, setSaving] = useState(false);

  const fetchSeasons = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [seasonsRes, awardsRes] = await Promise.all([
        axios.get('/api/admin/seasons', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/awards', { headers: { Authorization: `Bearer ${token}` } })
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

  const handleOpenDialog = (season = null) => {
    setEditSeason(season);
    setForm(season ? {
      ...season,
      startDate: season.startDate ? season.startDate.slice(0, 10) : '',
      endDate: season.endDate ? season.endDate.slice(0, 10) : ''
    } : emptySeason);
    setOpenDialog(true);
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditSeason(null);
    setForm(emptySeason);
  };
  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (editSeason) {
        await axios.put(`/api/admin/seasons/${editSeason.id}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/admin/seasons', form, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await fetchSeasons();
      handleCloseDialog();
    } catch (e) {
      setError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (season) => {
    if (!window.confirm('Удалить сезон?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/seasons/${season.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchSeasons();
    } catch (e) {
      setError('Ошибка удаления');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CalendarIcon sx={{ color: '#ffb347', fontSize: 32, mr: 1 }} />
        <Typography variant="h5" sx={{ color: '#ffb347', fontWeight: 700, flex: 1 }}>
          Управление сезонами
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Создать сезон
        </Button>
      </Box>
      {loading ? (
        <Typography>Загрузка...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Grid container spacing={2}>
          {seasons.map(season => (
            <Grid item xs={12} md={6} key={season.id}>
              <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }} elevation={4}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ color: '#ffb347', fontWeight: 600 }}>{season.name}</Typography>
                  <Typography variant="body2" sx={{ color: '#fff' }}>
                    {season.startDate?.slice(0,10)} — {season.endDate?.slice(0,10)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    {[1,2,3].map(place => {
                      const trophy = season[`trophy${place}`];
                      return trophy ? (
                        <Tooltip key={place} title={`Кубок за ${place} место: ${trophy.name}`}> 
                          <span>
                            <AwardIcon sx={{ color: '#ffb347', mr: 0.5 }} />
                            {trophy.name}
                          </span>
                        </Tooltip>
                      ) : null;
                    })}
                  </Box>
                </Box>
                <Tooltip title="Редактировать">
                  <IconButton onClick={() => handleOpenDialog(season)}><EditIcon /></IconButton>
                </Tooltip>
                <Tooltip title="Удалить">
                  <IconButton color="error" onClick={() => handleDelete(season)}><DeleteIcon /></IconButton>
                </Tooltip>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editSeason ? 'Редактировать сезон' : 'Создать сезон'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Название" name="name" value={form.name} onChange={handleChange} fullWidth />
          <TextField label="Дата начала" name="startDate" type="date" value={form.startDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="Дата окончания" name="endDate" type="date" value={form.endDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField select label="Кубок за 1 место" name="trophy1Id" value={form.trophy1Id} onChange={handleChange} fullWidth>
            <MenuItem value="">—</MenuItem>
            {awards.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
          </TextField>
          <TextField select label="Кубок за 2 место" name="trophy2Id" value={form.trophy2Id} onChange={handleChange} fullWidth>
            <MenuItem value="">—</MenuItem>
            {awards.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
          </TextField>
          <TextField select label="Кубок за 3 место" name="trophy3Id" value={form.trophy3Id} onChange={handleChange} fullWidth>
            <MenuItem value="">—</MenuItem>
            {awards.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>{editSeason ? 'Сохранить' : 'Создать'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSeasons; 