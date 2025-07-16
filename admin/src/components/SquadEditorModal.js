import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Alert } from '@mui/material';

function validateTag(value) {
  if (!value) return 'Тег обязателен';
  if (!/^[A-Za-z0-9]{2,8}$/.test(value)) return 'Только латиница и цифры, 2-8 символов';
  return null;
}

const SquadEditorModal = ({ open, onClose, squad }) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tagError, setTagError] = useState(null);

  useEffect(() => {
    if (squad) {
      setName(squad.name || '');
      setTag(squad.tag || '');
      setDescription(squad.description || '');
    } else {
      setName('');
      setTag('');
      setDescription('');
    }
    setError(null);
    setTagError(null);
  }, [squad, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tagErr = validateTag(tag);
    setTagError(tagErr);
    if (tagErr) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      let res;
      if (squad) {
        res = await fetch(`/api/squads/${squad.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ name, tag, description })
        });
        if (!res.ok) throw new Error('Ошибка при обновлении отряда');
      } else {
        res = await fetch('/api/squads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ name, tag, description })
        });
        if (!res.ok) throw new Error('Ошибка при создании отряда');
      }
      onClose(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{squad ? 'Редактировать отряд' : 'Создать отряд'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Название отряда" value={name} onChange={e => setName(e.target.value)} required fullWidth />
          <TextField label="Тег" value={tag} onChange={e => { setTag(e.target.value); setTagError(null); }} required fullWidth error={!!tagError} helperText={tagError} inputProps={{ maxLength: 8 }} />
          <TextField label="Описание" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline rows={2} inputProps={{ maxLength: 200 }} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={loading}>Отмена</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !name || !tag || !!tagError}>{loading ? 'Сохранение...' : 'Сохранить'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SquadEditorModal; 