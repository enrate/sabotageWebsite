import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NewsItem.css';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const NewsItem = ({ news }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loadingStats, setLoadingStats] = useState(false);

  // Получить id текущего сезона (берём из news.seasonId если есть, иначе не грузим stats)
  const seasonId = news.seasonId;

  const handleSendMessage = (user) => {
    window.location.href = `/messages?user=${user.id}`;
  };

  return (
    <div className="news-item">
      <h2>
        <Link to={`/news/${news.id}`}>{news.title}</Link>
      </h2>
      <p>{news.content.substring(0, 200)}...</p>
      <div className="news-meta">
        <span>
          Автор: {news.author ? (
            <span
              style={{ color: '#ffb347', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => navigate(`/profile/${news.author.id}`)}
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/profile/${news.author.id}`); }}
              aria-label={`Мини-профиль пользователя ${news.author.username}`}
            >
              {news.author.username}
            </span>
          ) : 'Администратор'}
        </span>
        <span>{new Date(news.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default NewsItem;