import React from 'react';
import { Link } from 'react-router-dom';
import './NewsPreview.css';

const NewsPreview = ({ news }) => {
  return (
    <div className="news-preview">
      <h3>
        <Link to={`/news/${news.id}`}>{news.title}</Link>
      </h3>
      <p>{news.content.substring(0, 100)}...</p>
      <small>{new Date(news.createdAt).toLocaleDateString()}</small>
    </div>
  );
};

export default NewsPreview;