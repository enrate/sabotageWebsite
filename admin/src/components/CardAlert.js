import * as React from 'react';
import Alert from '@mui/material/Alert';

export default function CardAlert() {
  // Можно кастомизировать под ваши нужды
  return (
    <Alert severity="info" sx={{ mt: 2 }}>
      Добро пожаловать в админку!
    </Alert>
  );
} 