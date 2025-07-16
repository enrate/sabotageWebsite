import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Grid, Alert, Switch, FormControlLabel } from '@mui/material';
import axios from 'axios';

const SettingsForm = () => {
  const [settings, setSettings] = useState({
    siteName: '',
    supportEmail: '',
    enableEmailNotifications: false,
    maxSquadSize: 10
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        const res = await axios.get('/api/admin/settings', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setSettings(res.data);
      } catch (e) {
        setError('Ошибка загрузки настроек');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setSettings(s => ({ ...s, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      await axios.put('/api/admin/settings', settings, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSuccess('Настройки успешно сохранены');
    } catch (e) {
      setError('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Typography>Загрузка...</Typography>;

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 3, color: '#ffb347' }}>Настройки сайта</Typography>
      <form onSubmit={handleSave}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Название сайта" name="siteName" value={settings.siteName} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Email поддержки" name="supportEmail" value={settings.supportEmail} onChange={handleChange} fullWidth required type="email" />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={settings.enableEmailNotifications} onChange={handleChange} name="enableEmailNotifications" />}
              label="Включить email-уведомления"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Максимальный размер сквада" name="maxSquadSize" value={settings.maxSquadSize} onChange={handleChange} fullWidth type="number" inputProps={{ min: 2, max: 100 }} />
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" color="primary" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </form>
    </Paper>
  );
};

export default SettingsForm; 