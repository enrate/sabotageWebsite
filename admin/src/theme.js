import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // Devias blue
      contrastText: '#fff',
    },
    secondary: {
      main: '#ffb347', // Акцент (оранжевый)
      contrastText: '#232946',
    },
    background: {
      default: '#18191a',
      paper: '#23272f',
    },
    text: {
      primary: '#fff',
      secondary: '#b8c5d6',
    },
    error: {
      main: '#ff6384',
    },
    success: {
      main: '#22c55e',
    },
    warning: {
      main: '#f59e42',
    },
    info: {
      main: '#38bdf8',
    },
    divider: 'rgba(255,255,255,0.08)',
  },
  typography: {
    fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontWeight: 700, fontSize: '2rem' },
    h3: { fontWeight: 600, fontSize: '1.75rem' },
    h4: { fontWeight: 600, fontSize: '1.5rem' },
    h5: { fontWeight: 500, fontSize: '1.25rem' },
    h6: { fontWeight: 500, fontSize: '1.125rem' },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 2px 0px rgba(16,24,40,0.05)',
    '0px 1.5px 4px 0px rgba(16,24,40,0.08)',
    ...Array(22).fill('0px 4px 24px 0px rgba(16,24,40,0.12)')
  ],
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#23272f',
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(16,24,40,0.18)',
          border: '1px solid rgba(99,102,241,0.12)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#23272f',
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
        containedPrimary: {
          background: 'linear-gradient(90deg,#6366f1 0%,#4f8cff 100%)',
          color: '#fff',
        },
        containedSecondary: {
          background: '#ffb347',
          color: '#232946',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        },
        head: {
          color: '#b8c5d6',
          fontWeight: 700,
          background: '#18191a',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#18191a',
          color: '#fff',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#23272f',
          color: '#fff',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          background: '#23272f',
          color: '#fff',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: 'rgba(255,255,255,0.12)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(99,102,241,0.08)',
          color: '#fff',
        },
      },
    },
  },
});

export default theme; 