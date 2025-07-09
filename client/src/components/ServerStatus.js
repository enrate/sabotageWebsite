import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Computer as ComputerIcon,
  SignalCellular4Bar as OnlineIcon,
  SignalCellular0Bar as OfflineIcon,
  SportsEsports as ScenarioIcon
} from '@mui/icons-material';

const ServerStatus = ({ server }) => {
  const isOnline = server.status === 'online';

  const maxPlayers = 128;
  const onlinePercentage = isOnline ? (server.players / maxPlayers) * 100 : 0;
  
  
  return (
    <Card
      elevation={8}
      sx={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 3,
        border: '1px solid #ffb347',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 25px 0 rgba(255,179,71,0.25), 0 3px 12px rgba(0,0,0,0.2)',
          borderColor: '#ffd580'
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -20,
          right: -20,
          width: 60,
          height: 60,
          zIndex: 0
        }
      }}
    >
      <CardContent
        sx={{
          p: 2,
          position: 'relative',
          zIndex: 1,
          '&:last-child': {
            pb: 2
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: '#ffb347',
              width: 32,
              height: 32,
              mr: 1.5
            }}
          >
            <ComputerIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Box>
            <Typography
              variant="h6"
              sx={{
                color: '#ffb347',
                fontWeight: 600,
                fontSize: '1rem',
                lineHeight: 1.2
              }}
            >
              {server.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: '#fff', opacity: 0.7, fontSize: '0.75rem', mt: 0.2, display: 'block' }}
            >
              {server.host || '83.136.235.40'}:{'2001'}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.85rem'
              }}
            >
              Статус:
            </Typography>
            <Chip
              icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
              label={server.status}
              size="small"
              sx={{
                bgcolor: isOnline ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 77, 79, 0.1)',
                color: isOnline ? '#4caf50' : '#ff4d4f',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                '& .MuiChip-icon': {
                  color: 'inherit'
                }
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.85rem'
              }}
            >
              Карта:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#ffb347',
                fontWeight: 600,
                fontSize: '0.85rem',
                maxWidth: '60%',
                textAlign: 'right',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {server.map || 'Не указан'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.85rem'
              }}
            >
              Игроков:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              {server.players}
            </Typography>
          </Box>
          
          {/* Progress Bar для онлайна */}
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.75rem'
                }}
              >
                Онлайн
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isOnline ? '#4caf50' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                {Math.round(onlinePercentage)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={onlinePercentage}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: isOnline 
                    ? 'linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)'
                    : 'linear-gradient(90deg, #ff4d4f 0%, #ff7875 100%)',
                  boxShadow: isOnline 
                    ? '0 0 8px rgba(76, 175, 80, 0.3)'
                    : '0 0 8px rgba(255, 77, 79, 0.3)'
                }
              }}
            />
          </Box>
          

        </Box>
      </CardContent>
    </Card>
  );
};

export default ServerStatus;