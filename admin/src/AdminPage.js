import React from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import AdminDashboard from "./components/AdminDashboard";
import AdminNews from "./AdminNews";
import AdminAwards from "./AdminAwards";
import AdminUsers from "./AdminUsers";
import AdminSquads from "./AdminSquads";
import AdminSeasons from "./AdminSeasons";
import AdminMatchHistory from "./AdminMatchHistory";
import AdminComments from "./AdminComments";
import AdminNotifications from "./AdminNotifications";
import AdminStatistics from "./AdminStatistics";
import AdminSettings from "./AdminSettings";
import AdminLogs from "./AdminLogs";

const tabRoutes = [
  { key: "dashboard", path: "dashboard", element: <AdminDashboard /> },
  { key: "news", path: "news", element: <AdminNews /> },
  { key: "awards", path: "awards", element: <AdminAwards /> },
  { key: "users", path: "users", element: <AdminUsers /> },
  { key: "squads", path: "squads", element: <AdminSquads /> },
  { key: "seasons", path: "seasons", element: <AdminSeasons /> },
  { key: "matches", path: "matches", element: <AdminMatchHistory /> },
  { key: "comments", path: "comments", element: <AdminComments /> },
  { key: "notifications", path: "notifications", element: <AdminNotifications /> },
  { key: "statistics", path: "statistics", element: <AdminStatistics /> },
  { key: "settings", path: "settings", element: <AdminSettings /> },
  { key: "logs", path: "logs", element: <AdminLogs /> },
];

export default function AdminPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Определяем активный раздел по URL
  const activeTab = tabRoutes.find(tab => location.pathname.includes(`/admin/${tab.path}`))?.key || "dashboard";

  return (
    <DashboardLayout section={activeTab} navigate={navigate}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        {tabRoutes.map(tab => (
          <Route key={tab.key} path={tab.path} element={tab.element} />
        ))}
        {/* fallback */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
} 