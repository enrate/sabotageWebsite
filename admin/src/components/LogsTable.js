import React, { useState } from 'react';
import {
  Box, Typography, TextField, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, InputAdornment, Tooltip, Button
} from '@mui/material';
import { Search as SearchIcon, Visibility as VisibilityIcon, ListAlt as LogIcon } from '@mui/icons-material';
import LogDetailModal from './LogDetailModal';

const LogsTable = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Фильтрация логов
  const filteredLogs = logs.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      String(item.id).includes(query) ||
      (item.type && item.type.toLowerCase().includes(query)) ||
      (item.user?.username && item.user.username.toLowerCase().includes(query)) ||
      (item.message && item.message.toLowerCase().includes(query))
    );
  });

  const handleOpenDetail = (log) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };
  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedLog(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ color: '#ffb347', display: 'flex', alignItems: 'center', gap: 1 }}>
          <LogIcon /> Системные логи
        </Typography>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Поиск по логам"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Пользователь</TableCell>
              <TableCell>Дата</TableCell>
              <TableCell>Сообщение</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.map(item => (
              <TableRow key={item.id} hover>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.user?.username}</TableCell>
                <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleString('ru-RU') : '-'}</TableCell>
                <TableCell>{item.message?.slice(0, 60)}...</TableCell>
                <TableCell align="right">
                  <Tooltip title="Просмотр">
                    <IconButton size="small" color="primary" onClick={() => handleOpenDetail(item)}><VisibilityIcon /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Модальное окно просмотра деталей */}
      <LogDetailModal open={detailOpen} onClose={handleCloseDetail} log={selectedLog} />
    </Box>
  );
};

export default LogsTable; 