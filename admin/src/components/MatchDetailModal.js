import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Table, TableHead, TableRow, TableCell, TableBody, Box } from '@mui/material';

const getPlayerStats = (player, match) => {
  // Имя игрока
  const name = player.name || player.playerIdentity || player.PlayerId || '-';
  // Результат (по фракции и factionObjectives)
  let result = '-';
  if (player.faction && Array.isArray(match.factionObjectives)) {
    const obj = match.factionObjectives.find(f => f.factionKey === player.faction);
    if (obj) {
      if (obj.resultName && obj.resultName.toLowerCase().includes('victory')) result = 'Победа';
      else if (obj.resultName && obj.resultName.toLowerCase().includes('loss')) result = 'Поражение';
      else result = obj.resultName || '-';
    }
  }
  // Убийства
  let kills = 0;
  if (Array.isArray(match.kills)) {
    kills = match.kills.filter(k => {
      // killerId может быть PlayerId или entityId
      return k.killerId === player.PlayerId || k.killerId === player.entityId;
    }).length;
  }
  // Смерти
  let deaths = 0;
  if (Array.isArray(match.kills)) {
    deaths = match.kills.filter(k => {
      return k.victimId === player.PlayerId || k.victimId === player.entityId;
    }).length;
  }
  return { name, result, kills, deaths };
};

const MatchDetailModal = ({ open, onClose, match }) => {
  if (!match) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Детали матча #{match.id || match.sessionId}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {match.date ? new Date(match.date).toLocaleString('ru-RU') : ''}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">Сценарий: {match.missionName || '-'}</Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Игрок</TableCell>
              <TableCell>Результат</TableCell>
              <TableCell>Убийства</TableCell>
              <TableCell>Смерти</TableCell>
              <TableCell>Δ Эло</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(match.players || []).map((player, idx) => {
              const stats = getPlayerStats(player, match);
              return (
                <TableRow key={player.playerIdentity || player.PlayerId || idx}>
                  <TableCell>{stats.name}</TableCell>
                  <TableCell>{stats.result}</TableCell>
                  <TableCell>{stats.kills}</TableCell>
                  <TableCell>{stats.deaths}</TableCell>
                  <TableCell>{
                    typeof player.eloAfter === 'number' && typeof player.eloChange === 'number'
                      ? `${player.eloAfter} (${player.eloChange > 0 ? '+' : ''}${player.eloChange})`
                      : typeof player.eloChange === 'number'
                        ? (player.eloChange > 0 ? `+${player.eloChange}` : player.eloChange)
                        : '—'
                  }</TableCell>
                </TableRow>
              );
            })}
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