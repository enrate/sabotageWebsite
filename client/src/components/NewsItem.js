import React from 'react';
import { Link } from 'react-router-dom';
import './NewsItem.css';

const NewsItem = ({ news }) => {
  return (
    <div className="news-item">
      <h2>
        <Link to={`/news/${news.id}`}>{news.title}</Link>
      </h2>
      <p>{news.content.substring(0, 200)}...</p>
      <div className="news-meta">
        <span>Автор: {news.author?.username || 'Администратор'}</span>
        <span>{new Date(news.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default NewsItem;