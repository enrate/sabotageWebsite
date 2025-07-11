import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  useTheme,
  Paper
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const PerformanceHistory = ({ performance }) => {
  const theme = useTheme();

  if (!performance || !Array.isArray(performance) || performance.length === 0) {
    return (
      <Typography variant="h5" sx={{ color: '#ffb347', mb: 3, textAlign: 'center' }}>
        Нет данных для отображения
      </Typography>
    );
  }

  // Подготовка данных для графиков
  const chartData = performance.map(item => ({
    season: `Сезон ${item.season}`,
    elo: item.elo ?? null,
    kd: item.kills && item.deaths ? (item.deaths ? (item.kills / item.deaths) : item.kills) : null,
  }));

  const getPlaceColor = (place) => {
    if (place === 1) return '#ffd700'; // Золото
    if (place === 2) return '#c0c0c0'; // Серебро
    if (place === 3) return '#cd7f32'; // Бронза
    if (place <= 5) return '#4caf50'; // Хорошо
    if (place <= 10) return '#ff9800'; // Средне
    return '#f44336'; // Плохо
  };

  const getPlaceIcon = (place) => {
    if (place === 1) return '🥇';
    if (place === 2) return '🥈';
    if (place === 3) return '🥉';
    return '📊';
  };

  const getAveragePlace = () => {
    const total = performance.reduce((sum, item) => sum + item.place, 0);
    return (total / performance.length).toFixed(1);
  };

  const getAveragePoints = () => {
    const total = performance.reduce((sum, item) => sum + item.points, 0);
    return Math.round(total / performance.length);
  };

  const getBestSeason = () => {
    return performance.reduce((best, current) => 
      current.place < best.place ? current : best
    );
  };

  return (
    <Box>
      {/* График рейтинга (ELO) */}
      <Box sx={{ mb: 4, p: 2 }}>
        <Typography variant="h6" sx={{ color: '#ffb347', mb: 2, textAlign: 'center', fontWeight: 600 }}>
          Рейтинг (ELO) по сезонам
        </Typography>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="season" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #ffb347', borderRadius: 8 }} />
            <Line type="monotone" dataKey="elo" stroke="#ffb347" strokeWidth={3} dot={{ fill: '#ffb347', strokeWidth: 2, r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
      {/* График K/D */}
      <Box sx={{ mb: 4, p: 2 }}>
        <Typography variant="h6" sx={{ color: '#ffb347', mb: 2, textAlign: 'center', fontWeight: 600 }}>
          K/D по сезонам
        </Typography>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="season" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #ffb347', borderRadius: 8 }} />
            <Line type="monotone" dataKey="kd" stroke="#ffb347" strokeWidth={3} dot={{ fill: '#ffb347', strokeWidth: 2, r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default PerformanceHistory; 