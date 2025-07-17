import * as React from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import AppNavbar from './AppNavbar';
import SideMenu from './SideMenu';

export default function DashboardLayout({ section, setSection, children }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      <AppNavbar />
      <SideMenu section={section} setSection={setSection} />
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 3 }, width: { sm: `calc(100% - 240px)` }, mt: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
        {children}
      </Box>
    </Box>
  );
} 