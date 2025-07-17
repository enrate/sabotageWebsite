import React, { useState } from "react";
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

export default function AdminPage() {
  const [section, setSection] = useState("dashboard");

  let content = null;
  switch (section) {
    case "dashboard":
      content = <AdminDashboard />;
      break;
    case "news":
      content = <AdminNews />;
      break;
    case "awards":
      content = <AdminAwards />;
      break;
    case "users":
      content = <AdminUsers />;
      break;
    case "squads":
      content = <AdminSquads />;
      break;
    case "seasons":
      content = <AdminSeasons />;
      break;
    case "matches":
      content = <AdminMatchHistory />;
      break;
    case "comments":
      content = <AdminComments />;
      break;
    case "notifications":
      content = <AdminNotifications />;
      break;
    case "statistics":
      content = <AdminStatistics />;
      break;
    case "settings":
      content = <AdminSettings />;
      break;
    case "logs":
      content = <AdminLogs />;
      break;
    default:
      content = <AdminDashboard />;
  }

  return (
    <DashboardLayout section={section} setSection={setSection}>
      {content}
    </DashboardLayout>
  );
} 