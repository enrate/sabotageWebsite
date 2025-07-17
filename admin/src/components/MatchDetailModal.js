import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Table, TableHead, TableRow, TableCell, TableBody, Box } from '@mui/material';

const MatchDetailModal = ({ open, onClose, match }) => {
  if (!match) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Детали матча #{match.id}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {match.date ? new Date(match.date).toLocaleString('ru-RU') : ''}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">Тип: {match.type || '-'}</Typography>
          <Typography variant="body1">Статус: {match.status || '-'}</Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Игрок/Отряд</TableCell>
              <TableCell>Результат</TableCell>
              <TableCell>Убийства</TableCell>
              <TableCell>Смерти</TableCell>
              <TableCell>Очки</TableCell>
              <TableCell>Δ Эло</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(match.results || match.players || []).map((res, idx) => (
              <TableRow key={idx}>
                <TableCell>{res.playerName || res.name || res.squadName || '-'}</TableCell>
                <TableCell>{res.result || '-'}</TableCell>
                <TableCell>{res.kills ?? '-'}</TableCell>
                <TableCell>{res.deaths ?? '-'}</TableCell>
                <TableCell>{res.score ?? '-'}</TableCell>
                <TableCell>{typeof res.eloChange === 'number' ? (res.eloChange > 0 ? `+${res.eloChange}` : res.eloChange) : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MatchDetailModal; 