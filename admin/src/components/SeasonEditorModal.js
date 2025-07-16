import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, MenuItem, Box, Alert } from '@mui/material';

const emptySeason = { name: '', startDate: '', endDate: '', trophy1Id: '', trophy2Id: '', trophy3Id: '' };

const SeasonEditorModal = ({ open, onClose, season, awards }) => {
  const [form, setForm] = useState(emptySeason);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (season) {
      setForm({
        ...season,
        startDate: season.startDate ? season.startDate.slice(0, 10) : '',
        endDate: season.endDate ? season.endDate.slice(0, 10) : ''
      });
    } else {
      setForm(emptySeason);
    }
    setError(null);
  }, [season, open]);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      let res;
      if (season) {
        res = await fetch(`/api/admin/seasons/${season.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error('Ошибка при обновлении сезона');
      } else {
        res = await fetch('/api/admin/seasons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error('Ошибка при создании сезона');
      }
      onClose(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{season ? 'Редактировать сезон' : 'Создать сезон'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSave} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Название" name="name" value={form.name} onChange={handleChange} fullWidth required />
          <TextField label="Дата начала" name="startDate" type="date" value={form.startDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} required />
          <TextField label="Дата окончания" name="endDate" type="date" value={form.endDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} required />
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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={saving}>Отмена</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving || !form.name || !form.startDate || !form.endDate}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SeasonEditorModal; 