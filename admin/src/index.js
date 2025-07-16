import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from "./context/AdminAuthContext";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboard from "./components/AdminDashboard";
import AdminPrivateRoute from "./components/AdminPrivateRoute";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
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
  </React.StrictMode>
); 