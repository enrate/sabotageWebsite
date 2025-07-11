import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './NewsItem.css';
import MiniProfile from './MiniProfile';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const NewsItem = ({ news }) => {
  const { currentUser } = useAuth();
  const [miniProfile, setMiniProfile] = useState({ open: false, anchorEl: null, user: null, stats: null });
  const [loadingStats, setLoadingStats] = useState(false);

  // Получить id текущего сезона (берём из news.seasonId если есть, иначе не грузим stats)
  const seasonId = news.seasonId;

  const handleMiniProfileOpen = async (event) => {
    if (!news.author || !seasonId) return;
    setMiniProfile({ open: true, anchorEl: event.currentTarget, user: news.author, stats: null });
    setLoadingStats(true);
    try {
      const res = await axios.get(`/api/seasons/player-stats`, { params: { userId: news.author.id, seasonId } });
      setMiniProfile(prev => ({ ...prev, stats: res.data }));
    } catch {
      setMiniProfile(prev => ({ ...prev, stats: null }));
    } finally {
      setLoadingStats(false);
    }
  };
  const handleMiniProfileClose = () => {
    setMiniProfile({ open: false, anchorEl: null, user: null, stats: null });
  };
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
              onClick={handleMiniProfileOpen}
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleMiniProfileOpen(e); }}
              aria-label={`Мини-профиль пользователя ${news.author.username}`}
            >
              {news.author.username}
            </span>
          ) : 'Администратор'}
        </span>
        <span>{new Date(news.createdAt).toLocaleDateString()}</span>
      </div>
      <MiniProfile
        user={miniProfile.user}
        seasonStats={miniProfile.stats}
        anchorEl={miniProfile.anchorEl}
        open={miniProfile.open}
        onClose={handleMiniProfileClose}
        onSendMessage={handleSendMessage}
        currentUserId={currentUser?.id}
      />
    </div>
  );
};

export default NewsItem;