import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import axios from 'axios';

const YouTubeLinkModal = ({ open, onClose, onSuccess }) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/youtube/link', 
        { youtubeUrl }, 
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      setSuccess(response.data.message);
      setTimeout(() => {
        onSuccess(response.data);
        onClose();
        setYoutubeUrl('');
        setSuccess('');
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при привязке YouTube канала');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setYoutubeUrl('');
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Привязать YouTube канал
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Вставьте ссылку на ваш YouTube канал. Поддерживаются следующие форматы:
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
              Поддерживаемые форматы:
            </Typography>
            <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 0.5 }}>
              • https://www.youtube.com/channel/UC...
            </Typography>
            <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 0.5 }}>
              • https://www.youtube.com/c/ChannelName
            </Typography>
            <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 0.5 }}>
              • https://www.youtube.com/@username
            </Typography>
            <Typography variant="caption" component="div" sx={{ color: 'text.secondary' }}>
              • https://www.youtube.com/user/username
            </Typography>
          </Box>

          <TextField
            autoFocus
            margin="dense"
            label="Ссылка на YouTube канал"
            type="url"
            fullWidth
            variant="outlined"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/channel/UC..."
            disabled={loading}
            error={!!error}
            helperText={error}
          />

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Отмена
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || !youtubeUrl.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Привязка...' : 'Привязать'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default YouTubeLinkModal; 