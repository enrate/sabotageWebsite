import React from 'react';
import { Popover, Card, CardContent, Avatar, Typography, Button, Box, Divider } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { Link } from 'react-router-dom';

const statLabels = [
  { key: 'elo', label: 'Рейтинг' },
  { key: 'kills', label: 'Убийства' },
  { key: 'deaths', label: 'Смерти' },
  { key: 'teamkills', label: 'Тимкиллы' },
  { key: 'winrate', label: 'Win %' },
  { key: 'matches', label: 'Матчи' },
];

const MiniProfile = ({ user, seasonStats, anchorEl, open, onClose, onSendMessage, currentUserId }) => {
  if (!user) return null;
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      disableScrollLock={true}
      PaperProps={{
        sx: {
          minWidth: 270,
          maxWidth: 320,
          borderRadius: 3,
          bgcolor: 'rgba(30,30,30,0.98)',
          color: '#fff',
          boxShadow: '0 6px 32px 0 rgba(255,179,71,0.18), 0 2px 12px rgba(0,0,0,0.18)',
          border: '1px solid #ffb347',
          p: 0
        }
      }}
    >
      <Card elevation={0} sx={{ bgcolor: 'transparent', p: 0 }}>
        <CardContent sx={{ p: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={user.avatar}
              sx={{ width: 56, height: 56, bgcolor: user.avatar ? 'transparent' : '#ffb347', color: '#23242a', fontWeight: 700 }}
            >
              {!user.avatar && <PersonIcon sx={{ fontSize: 32 }} />}
            </Avatar>
            <Box>
              <Typography
                component={Link}
                to={`/profile/${user.id}`}
                sx={{ color: '#ffb347', fontWeight: 700, fontSize: '1.2rem', textDecoration: 'none', '&:hover': { color: '#ffd580' } }}
                onClick={onClose}
              >
                {user.username}
              </Typography>
              {/* Отображение отряда */}
              {user.squadId && user.squadName && (
                <Typography
                  component={Link}
                  to={`/squads/${user.squadId}`}
                  sx={{ color: '#ffd580', fontWeight: 500, fontSize: '0.98rem', textDecoration: 'none', display: 'block', mt: 0.5, '&:hover': { color: '#fff3c1', textDecoration: 'underline' } }}
                  onClick={onClose}
                >
                  {`Отряд: ${user.squadName}`}
                </Typography>
              )}
            </Box>
          </Box>
          <Divider sx={{ my: 1, borderColor: '#ffb347', opacity: 0.3 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#ffb347', fontWeight: 600 }}>Рейтинг в сезоне</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {seasonStats && seasonStats.elo !== undefined ? seasonStats.elo : '-'}
            </Typography>
          </Box>
        </CardContent>
        {currentUserId !== user.id && (
          <Box sx={{ p: 2, pt: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="small"
              sx={{ bgcolor: '#ffb347', color: '#232526', fontWeight: 600, '&:hover': { bgcolor: '#ffd580' } }}
              onClick={() => { onSendMessage && onSendMessage(user); onClose(); }}
            >
              Отправить сообщение
            </Button>
          </Box>
        )}
      </Card>
    </Popover>
  );
};

export default MiniProfile; 