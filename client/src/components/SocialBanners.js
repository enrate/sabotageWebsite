import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const BoostyBanner = () => (
  <Card
    elevation={8}
    sx={{
      mb: 2,
      background: 'linear-gradient(135deg,rgb(204, 180, 171) 50%,rgb(212, 185, 154) 100%)',
      borderRadius: 3,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      animation: 'boostyPulse 3s ease-in-out infinite',
      '@keyframes boostyPulse': {
        '0%': {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(255,179,71,0.18), 0 2px 10px rgba(0,0,0,0.16)'
        },
        '50%': {
          borderColor: 'rgba(248, 172, 72, 0.4)',
          boxShadow: '0 8px 32px 0 rgba(248, 172, 72, 0.4), 0 2px 10px rgba(0,0,0,0.16)'
        },
        '100%': {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(255,179,71,0.18), 0 2px 10px rgba(0,0,0,0.16)'
        }
      },
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        animation: 'none'
      }
    }}
    onClick={() => window.open('https://boosty.to/sabotagegames/donate', '_blank', 'noopener,noreferrer')}
  >
    {/* Фоновый логотип с блюром */}
    <Box
      component="img"
      src="/boosty-logo.png"
      alt="Boosty Background"
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 0.15,
        filter: 'blur(2px) brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(360deg) brightness(104%) contrast(119%)',
        zIndex: 0
      }}
    />
    
    <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          component="img"
          src="/boosty-icon.svg"
          alt="Boosty"
          sx={{
            width: 48,
            height: 48,
            mr: 2,
            borderRadius: 1,
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            p: 0.5,
            filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(360deg) brightness(104%) contrast(119%)'
          }}
        />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            Поддержать проект
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Поддержите развитие проекта на Boosty
          </Typography>
        </Box>
      </Box>
      <Button
        variant="contained"
        startIcon={<OpenInNewIcon />}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.3)',
            transform: 'scale(1.05)'
          },
          transition: 'all 0.3s ease'
        }}
      >
        Поддержать
      </Button>
    </CardContent>
  </Card>
);

const DiscordBanner = () => (
  <Card
    elevation={8}
    sx={{
      mb: 2,
      background: 'linear-gradient(135deg,rgb(71, 83, 218) 0%,rgb(112, 87, 223) 100%)',
      borderRadius: 3,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
        borderColor: 'rgba(255, 255, 255, 0.2)'
      }
    }}
    onClick={() => window.open('https://discord.gg/TjFyzhN7QG', '_blank', 'noopener,noreferrer')}
  >
    {/* Фоновый логотип с блюром */}
    <Box
      component="img"
      src="/discord-logo.png"
      alt="Discord Background"
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 0.15,
        filter: 'blur(2px) brightness(0) invert(1)',
        zIndex: 0
      }}
    />
    
    <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          component="img"
          src="/discord-icon.png"
          alt="Discord"
          sx={{
            width: 48,
            height: 48,
            mr: 2,
            borderRadius: 1,
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            p: 0.5,
            filter: 'brightness(0) invert(1)'
          }}
        />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            Наш Discord
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          Присоединяйтесь к сообществу
          </Typography>
        </Box>
      </Box>
      <Button
        variant="contained"
        startIcon={<OpenInNewIcon />}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.3)',
            transform: 'scale(1.05)'
          },
          transition: 'all 0.3s ease'
        }}
      >
        Присоединиться
      </Button>
    </CardContent>
  </Card>
);

const YouTubeBanner = () => (
  <Card
    elevation={8}
    sx={{
      mb: 2,
      background: 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
      borderRadius: 3,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
        borderColor: 'rgba(255, 255, 255, 0.2)'
      }
    }}
    onClick={() => window.open('https://www.youtube.com/@sbtgenrate', '_blank', 'noopener,noreferrer')}
  >
    {/* Фоновый логотип с блюром */}
    <Box
      component="img"
      src="/youtube-logo.png"
      alt="YouTube Background"
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 0.15,
        filter: 'blur(2px)',
        zIndex: 0
      }}
    />
    
    <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          component="img"
          src="/youtube-icon.png"
          alt="YouTube"
          sx={{
            width: 48,
            height: 48,
            mr: 2,
            borderRadius: 1,
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            p: 0.5,
          }}
        />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            Наш YouTube
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Смотрите наши видео
          </Typography>
        </Box>
      </Box>
      <Button
        variant="contained"
        startIcon={<OpenInNewIcon />}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.3)',
            transform: 'scale(1.05)'
          },
          transition: 'all 0.3s ease'
        }}
      >
        Смотреть
      </Button>
    </CardContent>
  </Card>
);

const SocialBanners = () => (
  <Box>
    <BoostyBanner />
    <DiscordBanner />
    <YouTubeBanner />
  </Box>
);

export default SocialBanners; 