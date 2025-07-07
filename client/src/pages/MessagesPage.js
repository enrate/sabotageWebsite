import React from 'react';
import DirectMessages from '../components/DirectMessages';
import { Container, Box, Typography } from '@mui/material';

const MessagesPage = () => (
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
);

export default MessagesPage; 