import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  useTheme, 
  useMediaQuery 
} from '@mui/material';
import { Copyright as CopyrightIcon } from '@mui/icons-material';

const Footer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      component="footer"
      sx={{
        display: { xs: 'none', sm: 'none', md: 'block' },
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(10px)',
        color: '#ffd580',
        textAlign: 'center',
        py: isMobile ? 1.2 : 2,
        px: 2,
        position: 'relative',
        bottom: 0,
        width: '100%',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.12)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontWeight: 500,
        fontSize: isMobile ? '0.97rem' : '1.08rem',
        letterSpacing: '0.5px',
        zIndex: 1200,
        animation: 'footerFadeIn 1.2s cubic-bezier(0.23, 1, 0.32, 1)',
        '@keyframes footerFadeIn': {
          '0%': { opacity: 0, transform: 'translateY(30px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        '&:hover': { borderTopColor: '#ffd580' }
      }}
    >
      <Container maxWidth="lg" sx={{ px: isMobile ? 1 : 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? 0.5 : 2,
            width: '100%'
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: isMobile ? '0.97rem' : '1.08rem',
              color: '#ffd580',
              textShadow: '0 1px 4px rgba(255,213,128,0.08)',
              fontWeight: 600,
              letterSpacing: '0.5px',
              flex: 'none'
            }}
          >
            {new Date().getFullYear()} Sabotage Games
          </Typography>
          <Box sx={{ flex: isMobile ? 'none' : 1 }} />
          <Typography
            variant="body2"
            sx={{
              fontSize: isMobile ? '0.93rem' : '1.01rem',
              color: '#ffd580',
              opacity: 0.85,
              fontWeight: 400,
              letterSpacing: '0.3px',
              textAlign: isMobile ? 'center' : 'right',
              minWidth: 120
            }}
          >
            Разработано <Box component="span" sx={{ color: '#fff', fontWeight: 700, letterSpacing: '0.5px', ml: 0.5 }}>enrate</Box>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;