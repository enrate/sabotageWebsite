import React, { useEffect, useState } from 'react';
import NewsTable from './components/NewsTable';
import axios from 'axios';

const AdminNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await axios.get('/api/admin/news', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      // Гарантируем уникальный id
      const rows = Array.isArray(res.data) ? res.data.map(row => ({
        ...row,
        id: row.id || row.newsId || row._id || row.uuid
      })) : [];
      setNews(rows);
    } catch (e) {
      setError('Ошибка загрузки новостей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return <NewsTable news={news} setNews={setNews} />;
};

export default AdminNews; 