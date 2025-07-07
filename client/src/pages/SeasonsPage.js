import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Paper, Avatar, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, Card, CardContent } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import axios from 'axios';
import { Link } from 'react-router-dom';

const columns = [
  { label: 'Место', key: 'place', align: 'center' },
  { label: 'Игрок', key: 'name', align: 'left' },
  { label: 'Рейтинг', key: 'elo', align: 'right' },
  { label: 'К/Д', key: 'kd', align: 'right' },
  { label: 'Убийства', key: 'kills', align: 'right' },
  { label: 'Смерти', key: 'deaths', align: 'right' },
  { label: 'Тимкиллы', key: 'teamkills', align: 'right' },
  { label: 'Win %', key: 'winrate', align: 'right' },
  { label: 'Матчи', key: 'matches', align: 'right' },
];

const SeasonsPage = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonIdx, setSeasonIdx] = useState(0);
  const [tab, setTab] = useState(0);
  const [players, setPlayers] = useState([]);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [seasonsError, setSeasonsError] = useState(null);
  const season = seasons[seasonIdx] || {};

  useEffect(() => {
    setSeasonsLoading(true);
    setSeasonsError(null);
    axios.get('/api/seasons')
      .then(res => {
        setSeasons(res.data);
        setSeasonIdx(res.data.length ? res.data.length - 1 : 0);
      })
      .catch(() => setSeasonsError('Ошибка загрузки сезонов'))
      .finally(() => setSeasonsLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        const [playersRes, squadsRes] = await Promise.all([
          axios.get('/api/seasons/top-players'),
          axios.get('/api/seasons/top-squads')
        ]);
        setPlayers(playersRes.data);
        setSquads(squadsRes.data);
      } catch (e) {
        setError('Ошибка загрузки топа');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePrev = () => setSeasonIdx(idx => Math.max(0, idx - 1));
  const handleNext = () => setSeasonIdx(idx => Math.min(seasons.length - 1, idx + 1));

  const data = tab === 0 ? players : squads;
  const nameLabel = tab === 0 ? 'Игрок' : 'Название отряда';

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 6 }}>
      <Typography variant="h4" sx={{ color: '#ffb347', fontWeight: 700, mb: 3, textAlign: 'center' }}>
        Сезоны
      </Typography>
      {/* Карусель сезонов */}
      {seasonsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
          <CircularProgress color="warning" />
        </Box>
      ) : seasonsError ? (
        <Alert severity="error">{seasonsError}</Alert>
      ) : seasons.length === 0 ? (
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', mb: 4 }}>Нет сезонов</Typography>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
          <Button onClick={handlePrev} disabled={seasonIdx === 0}><ArrowBackIosIcon /></Button>
          <Paper sx={{
            px: 4,
            py: 2,
            mx: 2,
            minWidth: 220,
            textAlign: 'center',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 179, 71, 0.2)',
            boxShadow: '0 6px 32px 0 rgba(255,179,71,0.18), 0 2px 12px rgba(0,0,0,0.18)',
            color: '#fff',
            position: 'relative'
          }}>
            <Typography variant="h6" sx={{ color: '#ffb347', fontWeight: 600 }}>{season.name}</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{season.startDate?.slice(0,10)} — {season.endDate?.slice(0,10)}</Typography>
          </Paper>
          <Button onClick={handleNext} disabled={seasonIdx === seasons.length - 1}><ArrowForwardIosIcon /></Button>
        </Box>
      )}
      {/* Табы */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 3 }}>
        <Tab label="Игроки" />
        <Tab label="Отряды" />
      </Tabs>
      <Card
        elevation={8}
        sx={{
          p: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 3,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 179, 71, 0.2)',
          boxShadow: '0 6px 32px 0 rgba(255,179,71,0.18), 0 2px 12px rgba(0,0,0,0.18)',
          color: '#fff',
          minHeight: 400,
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          maxWidth: 1200,
          minWidth: 1200,
          mx: 'auto'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <CircularProgress color="warning" />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {columns.map(col => (
                      <TableCell key={col.key} align={col.align} sx={{ color: '#ffb347', fontWeight: 700, fontSize: '1rem', background: 'transparent' }}>
                        {col.key === 'name' ? nameLabel : col.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, idx) => (
                    <TableRow
                      key={row.id}
                      sx={{
                        '& td': { borderBottom: '1px solid #444' }
                      }}
                    >
                      <TableCell align="center" sx={{ fontWeight: 700 }}>{idx + 1}</TableCell>
                      <TableCell align="left" sx={{ borderBottom: 'none' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar src={row.avatar} sx={{ width: 32, height: 32, bgcolor: '#ffb347', color: '#23242a', fontWeight: 700, mr: 1 }}>{row.username ? row.username[0] : row.name[0]}</Avatar>
                          {tab === 0 ? (
                            <Typography
                              component={Link}
                              to={`/profile/${row.id}`}
                              sx={{ color: '#ffb347', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', borderBottom: 'none', '&:hover, &:focus': { color: '#ffd580', textDecoration: 'none', borderBottom: 'none' } }}
                            >
                              {row.username}
                            </Typography>
                          ) : (
                            <Typography
                              component={Link}
                              to={`/squads/${row.id}`}
                              sx={{ color: '#ffb347', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', borderBottom: 'none', '&:hover, &:focus': { color: '#ffd580', textDecoration: 'none', borderBottom: 'none' } }}
                            >
                              {row.name}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{row.elo}</TableCell>
                      <TableCell align="right">{row.kills && row.deaths ? (row.deaths ? (row.kills / row.deaths).toFixed(2) : row.kills) : row.kd || '-'}</TableCell>
                      <TableCell align="right">{row.kills}</TableCell>
                      <TableCell align="right">{row.deaths}</TableCell>
                      <TableCell align="right">{row.teamkills}</TableCell>
                      <TableCell align="right">{row.winrate}%</TableCell>
                      <TableCell align="right">{row.matches}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SeasonsPage; 