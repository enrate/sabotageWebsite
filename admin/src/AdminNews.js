import React from 'react';
import NewsTable from './components/NewsTable';

const AdminNews = ({ news, setNews }) => {
  return <NewsTable news={news} setNews={setNews} />;
};

export default AdminNews; 