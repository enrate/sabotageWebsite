import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from "./context/AdminAuthContext";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminPage from "./AdminPage";
import AdminPrivateRoute from "./components/AdminPrivateRoute";
import AppTheme from './AppTheme';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppTheme>
      <AdminAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/*" element={
              <AdminPrivateRoute>
                <AdminPage />
              </AdminPrivateRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AdminAuthProvider>
    </AppTheme>
  </React.StrictMode>
); 