import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import AwardEditorModal from '../components/admin/AwardEditorModal';

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

export default function AdminAwardsPage() {
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openEditor, setOpenEditor] = useState(false);
  const [editingAward, setEditingAward] = useState(null);
  const [filter, setFilter] = useState({ category: '', isSeasonAward: '', isActive: '' });

  const fetchAwards = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filter.category) params.category = filter.category;
      if (filter.isSeasonAward !== '') params.isSeasonAward = filter.isSeasonAward;
      if (filter.isActive !== '') params.isActive = filter.isActive;
      const res = await axios.get('/api/awards', { params });
      setAwards(res.data);
    } catch (err) {
      setError('Ошибка при загрузке наград');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAwards();
    // eslint-disable-next-line
  }, [filter]);

  const handleEdit = (award) => {
    setEditingAward(award);
    setOpenEditor(true);
  };

  const handleCreate = () => {
    setEditingAward(null);
    setOpenEditor(true);
  };

  const handleEditorClose = (updated) => {
    setOpenEditor(false);
    setEditingAward(null);
    if (updated) fetchAwards();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Управление наградами</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl size="small">
          <InputLabel>Категория</InputLabel>
          <Select
            value={filter.category}
            label="Категория"
            onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
          >
            <MenuItem value="">Все</MenuItem>
            {CATEGORIES.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Сезонная</InputLabel>
          <Select
            value={filter.isSeasonAward}
            label="Сезонная"
            onChange={e => setFilter(f => ({ ...f, isSeasonAward: e.target.value }))}
          >
            <MenuItem value="">Все</MenuItem>
            <MenuItem value={true}>Да</MenuItem>
            <MenuItem value={false}>Нет</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Активна</InputLabel>
          <Select
            value={filter.isActive}
            label="Активна"
            onChange={e => setFilter(f => ({ ...f, isActive: e.target.value }))}
          >
            <MenuItem value="">Все</MenuItem>
            <MenuItem value={true}>Да</MenuItem>
            <MenuItem value={false}>Нет</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Создать награду
        </Button>
      </Box>
      {error && <Typography color="error">{error}</Typography>}
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Категория</TableCell>
              <TableCell>Тип назначения</TableCell>
              <TableCell>Сезонная</TableCell>
              <TableCell>Условия</TableCell>
              <TableCell>Активна</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {awards.map(award => (
              <TableRow key={award.id}>
                <TableCell>{award.name}</TableCell>
                <TableCell>{CATEGORIES.find(c => c.value === award.category)?.label || award.category}</TableCell>
                <TableCell>{ASSIGNMENT_TYPES.find(a => a.value === award.assignmentType)?.label || award.assignmentType}</TableCell>
                <TableCell>{award.isSeasonAward ? 'Да' : 'Нет'}</TableCell>
                <TableCell>
                  {award.assignmentType === 'manual' && '—'}
                  {award.assignmentType !== 'manual' && (
                    <>
                      {award.registrationDeadline && <div>Регистрация до: {new Date(award.registrationDeadline).toLocaleDateString()}</div>}
                      {award.minMatches && <div>Матчей: ≥ {award.minMatches}</div>}
                      {award.minWins && <div>Побед: ≥ {award.minWins}</div>}
                      {award.minKills && <div>Убийств: ≥ {award.minKills}</div>}
                      {award.minElo && <div>ELO: ≥ {award.minElo}</div>}
                      {award.assignmentConditions && <div>Условия: {JSON.stringify(award.assignmentConditions)}</div>}
                    </>
                  )}
                </TableCell>
                <TableCell>{award.isActive ? 'Да' : 'Нет'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(award)}><EditIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <AwardEditorModal
        open={openEditor}
        onClose={handleEditorClose}
        award={editingAward}
      />
    </Box>
  );
} 