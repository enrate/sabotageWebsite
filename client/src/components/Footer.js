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
        backgroundColor: '#232526',
        color: '#bdbdbd',
        textAlign: 'center',
        py: isMobile ? 1.5 : 2.25,
        px: 2,
        position: 'relative',
        bottom: 0,
        width: '100%',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
        borderTop: '2px solid #ffb347',
        transition: 'border-color 0.3s',
        animation: 'footerFadeIn 1.2s cubic-bezier(0.23, 1, 0.32, 1)',
        '@keyframes footerFadeIn': {
          '0%': { 
            opacity: 0, 
            transform: 'translateY(30px)' 
          },
          '100%': { 
            opacity: 1, 
            transform: 'translateY(0)' 
          }
        },
        '&:hover': {
          borderTopColor: '#ffd580'
        }
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          <CopyrightIcon 
            sx={{ 
              fontSize: '1.1em',
              color: '#ffd580',
              filter: 'drop-shadow(0 1px 4px rgba(255,213,128,0.12))'
            }} 
          />
          <Typography
            variant={isMobile ? "body2" : "body1"}
            sx={{
              margin: 0,
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              letterSpacing: '0.5px',
              color: '#ffd580',
              textShadow: '0 1px 4px rgba(255,213,128,0.08)',
              transition: 'color 0.2s',
              fontWeight: 500
            }}
          >
            {new Date().getFullYear()} Arma Reforger Community
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;