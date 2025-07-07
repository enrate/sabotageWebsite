import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#ffb347',
      light: '#ffd580',
      dark: '#e69c2e',
      contrastText: '#232946',
    },
    secondary: {
      main: '#4f8cff',
      light: '#7ba7ff',
      dark: '#2d5bb8',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ff6384',
      light: '#ff8fa3',
      dark: '#d32f2f',
    },
    background: {
      default: '#0f0f23',
      paper: '#232946',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b8c5d6',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.125rem',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#232946',
          border: '1px solid rgba(255, 179, 71, 0.2)',
          '&:hover': {
            borderColor: 'rgba(255, 179, 71, 0.4)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#232946',
          border: '1px solid rgba(255, 179, 71, 0.2)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
        },
        contained: {
          boxShadow: '0 2px 8px rgba(255, 179, 71, 0.3)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(255, 179, 71, 0.4)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 179, 71, 0.1)',
          borderColor: 'rgba(255, 179, 71, 0.3)',
          '&:hover': {
            backgroundColor: 'rgba(255, 179, 71, 0.2)',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(255, 179, 71, 0.4)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(255, 179, 71, 0.5)',
          },
        },
      },
    },
  },
});

export default theme; 