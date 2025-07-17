import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from "./context/AdminAuthContext";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboard from "./components/AdminDashboard";
import AdminPrivateRoute from "./components/AdminPrivateRoute";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AdminAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/*" element={
              <AdminPrivateRoute>
                <AdminDashboard />
              </AdminPrivateRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AdminAuthProvider>
    </ThemeProvider>
  </React.StrictMode>
); 