import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  useTheme,
  Paper,
  Button,
  CircularProgress
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
import GroupRemoveIcon from '@mui/icons-material/GroupRemove';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import PercentIcon from '@mui/icons-material/Percent';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

const metricCardStyle = {
  bgcolor: 'rgba(35,37,38,0.85)',
  border: '2px solid #ffb347',
  textAlign: 'center',
  p: 2,
  borderRadius: 3,
  boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
  color: '#fff',
  minHeight: 120
};

const metricList = [
  {
    key: 'place',
    label: 'Место в рейтинге',
    icon: <EmojiEventsIcon sx={{ color: '#ffb347', fontSize: 28 }} />,
    value: perf => perf.place ?? '-',
    valueColor: '#ffb347',
  },
  {
    key: 'elo',
    label: 'Рейтинг (эло)',
    icon: <StarIcon sx={{ color: '#ffb347', fontSize: 24 }} />,
    value: perf => perf.elo ?? '-',
  },
  {
    key: 'kills',
    label: 'Убийства',
    icon: <SportsKabaddiIcon sx={{ color: '#ffb347', fontSize: 24 }} />,
    value: perf => perf.kills ?? '-',
  },
  {
    key: 'deaths',
    label: 'Смерти',
    icon: <GroupRemoveIcon sx={{ color: '#ffb347', fontSize: 24 }} />,
    value: perf => perf.deaths ?? '-',
  },
  {
    key: 'teamkills',
    label: 'Тимкиллы',
    icon: <MilitaryTechIcon sx={{ color: '#ffb347', fontSize: 24 }} />,
    value: perf => perf.teamkills ?? '-',
  },
  {
    key: 'kd',
    label: 'K/D',
    icon: <SportsEsportsIcon sx={{ color: '#ffb347', fontSize: 24 }} />,
    value: perf => perf.kills && perf.deaths ? (perf.deaths ? (perf.kills / perf.deaths).toFixed(2) : perf.kills) : '-',
  },
  {
    key: 'winrate',
    label: 'Процент побед',
    icon: <PercentIcon sx={{ color: '#ffb347', fontSize: 24 }} />,
    value: perf => perf.avg_winRate ?? '-',
  },
  {
    key: 'matches',
    label: 'Сыгранных матчей',
    icon: <SportsEsportsIcon sx={{ color: '#ffb347', fontSize: 24 }} />,
    value: perf => perf.matches ?? '-',
  },
];

const listContainerStyle = {
  // background: 'rgba(35,37,38,0.85)',
  // border: '2px solid #ffb347',
  borderRadius: 8,
  // boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
  color: '#fff',
  px: 0,
  py: 2,
  mb: 2,
  maxWidth: 480,
  mx: 'auto',
};

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: 3,
  py: 1.5,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  fontSize: 18,
};

const SquadStats = ({ stats, performance, squadId }) => {
  const theme = useTheme();
  const [seasons, setSeasons] = useState([]);
  const [seasonIdx, setSeasonIdx] = useState(0);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [seasonsError, setSeasonsError] = useState(null);
  const [seasonStats, setSeasonStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    setLoadingSeasons(true);
    setSeasonsError(null);
    axios.get('/api/seasons')
      .then(res => {
        setSeasons(res.data);
        setSeasonIdx(res.data.length ? res.data.length - 1 : 0);
      })
      .catch(() => setSeasonsError('Ошибка загрузки сезонов'))
      .finally(() => setLoadingSeasons(false));
  }, []);

  // Загрузка сезонной статистики с бэка
  useEffect(() => {
    const selectedSeason = seasons[seasonIdx];
    if (!selectedSeason || !squadId) {
      setSeasonStats(null);
      return;
    }
    setLoadingStats(true);
    axios.get(`/api/seasons/squad-stats?squadId=${squadId}&seasonId=${selectedSeason.id}`)
      .then(res => setSeasonStats(res.data))
      .catch(() => setSeasonStats(null))
      .finally(() => setLoadingStats(false));
  }, [seasonIdx, seasons, squadId]);

  const selectedSeason = seasons[seasonIdx];
  // Если есть данные с бэка — используем их, иначе старый механизм
  const seasonPerf = seasonStats || (performance && selectedSeason ? performance.find(p => String(p.season) === String(selectedSeason.id) || String(p.season) === String(selectedSeason.name) || String(p.season) === String(seasonIdx+1)) : null);

  if (loadingStats) {
    return <Box sx={{ textAlign: 'center', my: 4 }}><CircularProgress color="warning" /></Box>;
  }

  if (!seasonPerf) {
    return (
      <Typography variant="h5" sx={{ color: '#ffb347', mb: 3, textAlign: 'center' }}>
        Нет данных для отображения
      </Typography>
    );
  }

  // Данные для графика K/D
  const kdData = [
    { name: 'Убийства', value: stats.kills || 0, color: '#4f8cff' },
    { name: 'Смерти', value: stats.deaths || 0, color: '#ff6384' }
  ];

  // Данные для графика эффективности
  const efficiencyData = [
    { name: 'Win Rate', value: stats.avg_winRate || 0, color: '#4caf50' },
    { name: 'ELO', value: (stats.elo || 0) / 20, color: '#ffd700' } // Нормализуем ELO для графика
  ];

  // Данные для линейного графика прогресса
  const progressData = [
    { month: 'Янв', kills: stats.kills * 0.8 || 0, deaths: stats.deaths * 0.9 || 0 },
    { month: 'Фев', kills: stats.kills * 0.9 || 0, deaths: stats.deaths * 0.95 || 0 },
    { month: 'Мар', kills: stats.kills || 0, deaths: stats.deaths || 0 }
  ];

  const getKDRatio = () => {
    if (!stats.kills || !stats.deaths) return 0;
    return (stats.kills / stats.deaths).toFixed(2);
  };

  const getWinRateColor = (rate) => {
    if (rate >= 70) return '#4caf50';
    if (rate >= 50) return '#ff9800';
    return '#f44336';
  };

  const getEloColor = (elo) => {
    if (elo >= 1800) return '#ffd700';
    if (elo >= 1500) return '#c0c0c0';
    if (elo >= 1200) return '#cd7f32';
    return '#8b4513';
  };

  const handlePrev = () => setSeasonIdx(i => Math.max(0, i - 1));
  const handleNext = () => setSeasonIdx(i => Math.min(seasons.length - 1, i + 1));

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, gap: 2 }}>
        {loadingSeasons ? (
          <CircularProgress color="warning" />
        ) : seasonsError ? (
          <Typography color="error">{seasonsError}</Typography>
        ) : seasons.length === 0 ? (
          <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>Нет сезонов</Typography>
        ) : (
          <>
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
              <Typography variant="h6" sx={{ color: '#ffb347', fontWeight: 600 }}>{selectedSeason?.name || 'Сезон'}</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{selectedSeason?.startDate?.slice(0,10)} — {selectedSeason?.endDate?.slice(0,10)}</Typography>
            </Paper>
            <Button onClick={handleNext} disabled={seasonIdx === seasons.length - 1}><ArrowForwardIosIcon /></Button>
          </>
        )}
      </Box>
      {/* Если нет данных по сезону — заглушка */}
      {seasons.length > 0 && !seasonPerf && (
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', mb: 2 }}>Нет статистики по этому сезону</Typography>
      )}
      {seasonPerf && (
        <Box s={listContainerStyle}>
          {metricList.map((metric, idx) => (
            <Box key={metric.key} sx={{ ...rowStyle, borderBottom: idx === metricList.length - 1 ? 'none' : rowStyle.borderBottom }}>
              <Box sx={{ minWidth: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{metric.icon}</Box>
              <Typography sx={{ flex: 1, textAlign: 'center', color: '#fff', fontWeight: 500 }}>{metric.label}</Typography>
              <Typography sx={{ minWidth: 60, textAlign: 'right', fontWeight: 700, color: metric.valueColor || '#fff', fontSize: 22 }}>
                {metric.value(seasonPerf)}
              </Typography>
            </Box>
          ))}
      </Box>
      )}
    </>
  );
};

export default SquadStats; 