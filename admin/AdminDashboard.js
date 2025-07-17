import React, { useState, useEffect } from "react";
import AdminNews from './AdminNews';
import AdminAwards from './src/components/AdminAwards';
import AdminUsers from './AdminUsers';
import AdminSquads from './AdminSquads';
import AdminSeasons from './AdminSeasons';
import DashboardLayout from './src/components/DashboardLayout';
import axios from 'axios';

const sections = [
  { key: 'news', label: 'Новости' },
  { key: 'awards', label: 'Награды' },
  { key: 'users', label: 'Пользователи' },
  { key: 'squads', label: 'Сквады' },
  { key: 'seasons', label: 'Сезоны' },
];

export default function AdminDashboard() {
  const [section, setSection] = useState('news');
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [errorNews, setErrorNews] = useState(null);

  useEffect(() => {
    if (section === 'news') {
      setLoadingNews(true);
      axios.get('/api/news')
        .then(res => setNews(Array.isArray(res.data) ? res.data : []))
        .catch(() => setErrorNews('Ошибка загрузки новостей'))
        .finally(() => setLoadingNews(false));
    }
  }, [section]);

  return (
    <DashboardLayout section={section} setSection={setSection}>
      {section === 'news' && (
        loadingNews ? <div>Загрузка новостей...</div> :
        <AdminNews news={news} setNews={setNews} />
      )}
      {section === 'awards' && <AdminAwards />}
      {section === 'users' && <AdminUsers />}
      {section === 'squads' && <AdminSquads />}
      {section === 'seasons' && <AdminSeasons />}
    </DashboardLayout>
  );
} 