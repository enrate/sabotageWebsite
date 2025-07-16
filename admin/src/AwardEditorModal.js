import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Box, Typography, Avatar, IconButton
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

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
      setImagePreview(award.image || '');
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
      setImagePreview('');
      setImageFile(null);
    }
  }, [award, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Размер файла превышает 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Выберите изображение');
        return;
      }

      setImageFile(file);
      setError('');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Добавляем все поля формы
      Object.keys(form).forEach(key => {
        if (form[key] !== '' && form[key] !== null && form[key] !== undefined) {
          if (key === 'assignmentConditions' && form[key]) {
            try {
              formData.append(key, JSON.stringify(JSON.parse(form[key])));
            } catch {
              formData.append(key, form[key]);
            }
          } else if (key === 'registrationDeadline' && form[key]) {
            formData.append(key, new Date(form[key]).toISOString());
          } else if (['minMatches', 'minWins', 'minKills', 'minElo', 'maxRecipients', 'priority'].includes(key) && form[key]) {
            formData.append(key, Number(form[key]));
          } else {
            formData.append(key, form[key]);
          }
        }
      });
      
      // Добавляем файл изображения если есть
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      if (award) {
        await axios.put(`/api/admin/awards/${award.id}`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.post('/api/admin/awards', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
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
          
          {/* Загрузка изображения */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              src={imagePreview} 
              sx={{ width: 80, height: 80, bgcolor: imagePreview ? 'transparent' : '#ffb347' }}
            >
              {!imagePreview && '?'}
            </Avatar>
            <Box>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              <label htmlFor="image-upload">
                <IconButton color="primary" component="span">
                  <PhotoCamera />
                </IconButton>
              </label>
              <Typography variant="caption" display="block">
                {imageFile ? imageFile.name : 'Выберите изображение'}
              </Typography>
            </Box>
          </Box>
          
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