import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField, Box, Alert } from '@mui/material';

const CommentDetailModal = ({ open, onClose, comment, onSave }) => {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setText(comment?.text || '');
    setError(null);
  }, [comment, open]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/comments/${comment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error('Ошибка при сохранении комментария');
      onSave && onSave();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!comment) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Комментарий #{comment.id}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Автор: {comment.author?.username || '-'}</Typography>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Объект: {comment.targetType} #{comment.targetId}</Typography>
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Текст комментария"
            value={text}
            onChange={e => setText(e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving || !text}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommentDetailModal; 