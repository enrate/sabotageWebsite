import React from 'react';
import DirectMessages from '../components/DirectMessages';
import { Container, Box, Typography } from '@mui/material';

const MessagesPage = () => (
  <Box 
    sx={{ 
      minHeight: '100vh',
      width: '100%',
      color: '#fff',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        zIndex: 0
      }
    }}
  >
    <Box sx={{ 
      position: 'relative', 
      zIndex: 1 
    }}>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ color: '#ffb347', fontWeight: 700 }} gutterBottom>
            Личные сообщения
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Общайтесь с другими пользователями напрямую
          </Typography>
        </Box>
        <DirectMessages />
      </Container>
    </Box>
  </Box>
);

export default MessagesPage; 