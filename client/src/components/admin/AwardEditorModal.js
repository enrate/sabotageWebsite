import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Box, Typography
} from '@mui/material';
import axios from 'axios';

const CATEGORIES = [
  { value: 'general', label: 'Общая' },
  { value: 'season', label: 'Сезонная' },
  { value: 'achievement', label: 'Достижение' },
  { value: 'special', label: 'Специальная' },
];

const ASSIGNMENT_TYPES = [
  { value: 'manual', label: 'Ручное' },
  { value: 'automatic', label: 'Автоматическое' },
  { value: 'conditional', label: 'По условиям' },
];

export default function AwardEditorModal({ open, onClose, award }) {
  const [form, setForm] = useState({
    type: '',
    name: '',
    description: '',
    image: '',
    category: 'general',
    isSeasonAward: false,
    assignmentType: 'manual',
    registrationDeadline: '',
    minMatches: '',
    minWins: '',
    minKills: '',
    minElo: '',
    seasonId: '',
    isActive: true,
    maxRecipients: '',
    priority: 0,
    assignmentConditions: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (award) {
      setForm({
        ...award,
        registrationDeadline: award.registrationDeadline ? award.registrationDeadline.slice(0, 10) : '',
        minMatches: award.minMatches || '',
        minWins: award.minWins || '',
        minKills: award.minKills || '',
        minElo: award.minElo || '',
        maxRecipients: award.maxRecipients || '',
        priority: award.priority || 0,
        assignmentConditions: award.assignmentConditions ? JSON.stringify(award.assignmentConditions, null, 2) : '',
      });
    } else {
      setForm({
        type: '',
        name: '',
        description: '',
        image: '',
        category: 'general',
        isSeasonAward: false,
        assignmentType: 'manual',
        registrationDeadline: '',
        minMatches: '',
        minWins: '',
        minKills: '',
        minElo: '',
        seasonId: '',
        isActive: true,
        maxRecipients: '',
        priority: 0,
        assignmentConditions: '',
      });
    }
  }, [award, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const data = {
        ...form,
        minMatches: form.minMatches ? Number(form.minMatches) : undefined,
        minWins: form.minWins ? Number(form.minWins) : undefined,
        minKills: form.minKills ? Number(form.minKills) : undefined,
        minElo: form.minElo ? Number(form.minElo) : undefined,
        maxRecipients: form.maxRecipients ? Number(form.maxRecipients) : undefined,
        priority: form.priority ? Number(form.priority) : 0,
        registrationDeadline: form.registrationDeadline || undefined,
        assignmentConditions: form.assignmentConditions ? JSON.parse(form.assignmentConditions) : undefined,
      };
      
      if (award) {
        await axios.put(`/api/admin/awards/${award.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/admin/awards', data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      onClose(true);
    } catch (err) {
      setError('Ошибка при сохранении награды. Проверьте корректность данных.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{award ? 'Редактировать награду' : 'Создать награду'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Тип (код)" name="type" value={form.type} onChange={handleChange} required fullWidth />
          <TextField label="Название" name="name" value={form.name} onChange={handleChange} required fullWidth />
          <TextField label="Описание" name="description" value={form.description} onChange={handleChange} multiline rows={2} fullWidth />
          <TextField label="URL изображения" name="image" value={form.image} onChange={handleChange} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Категория</InputLabel>
            <Select name="category" value={form.category} label="Категория" onChange={handleChange}>
              {CATEGORIES.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Тип назначения</InputLabel>
            <Select name="assignmentType" value={form.assignmentType} label="Тип назначения" onChange={handleChange}>
              {ASSIGNMENT_TYPES.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Checkbox checked={!!form.isSeasonAward} name="isSeasonAward" onChange={handleChange} />}
            label="Сезонная награда"
          />
          <FormControlLabel
            control={<Checkbox checked={!!form.isActive} name="isActive" onChange={handleChange} />}
            label="Активна"
          />
          <TextField label="ID сезона (если сезонная)" name="seasonId" value={form.seasonId} onChange={handleChange} fullWidth />
          <TextField label="Приоритет" name="priority" type="number" value={form.priority} onChange={handleChange} fullWidth />
          <TextField label="Лимит получателей" name="maxRecipients" type="number" value={form.maxRecipients} onChange={handleChange} fullWidth />
          {form.assignmentType !== 'manual' && (
            <>
              <TextField label="Дедлайн регистрации (YYYY-MM-DD)" name="registrationDeadline" type="date" value={form.registrationDeadline} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="Мин. матчей" name="minMatches" type="number" value={form.minMatches} onChange={handleChange} fullWidth />
              <TextField label="Мин. побед" name="minWins" type="number" value={form.minWins} onChange={handleChange} fullWidth />
              <TextField label="Мин. убийств" name="minKills" type="number" value={form.minKills} onChange={handleChange} fullWidth />
              <TextField label="Мин. ELO" name="minElo" type="number" value={form.minElo} onChange={handleChange} fullWidth />
              <TextField
                label="Доп. условия (JSON)"
                name="assignmentConditions"
                value={form.assignmentConditions}
                onChange={handleChange}
                multiline rows={2}
                fullWidth
                placeholder='{"requiredRoles":["user"]}'
              />
            </>
          )}
          {error && <Typography color="error">{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={saving}>Отмена</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>{award ? 'Сохранить' : 'Создать'}</Button>
      </DialogActions>
    </Dialog>
  );
} 