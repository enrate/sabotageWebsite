import React, { useState } from 'react';
import axios from 'axios';
import './CreateSquadModal.css';

const YouTubeLinkModal = ({ open, onClose, onSuccess }) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/youtube/link', 
        { youtubeUrl }, 
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      setSuccess(response.data.message);
      setTimeout(() => {
        onSuccess(response.data);
        onClose();
        setYoutubeUrl('');
        setSuccess('');
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при привязке YouTube канала');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setYoutubeUrl('');
    setError('');
    setSuccess('');
    onClose();
  };

  // Закрытие по клику вне модалки
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(30,30,30,0.75)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s',
      }}
      onClick={handleOverlayClick}
    >
      <div
        className="create-squad-modal-card"
        style={{
          maxWidth: 480,
          minWidth: 320,
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2>Привязать YouTube канал</h2>
        
        {error && <div className="error">{error}</div>}
        {success && <div style={{ color: '#52c41a', fontWeight: 500, marginBottom: 16 }}>{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Ссылка на YouTube канал</label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/channel/UC..."
              required
              disabled={loading}
            />
          </div>
          
          <div style={{ 
            background: 'rgba(255, 179, 71, 0.1)', 
            border: '1px solid rgba(255, 179, 71, 0.3)', 
            borderRadius: 8, 
            padding: 12, 
            marginBottom: 16,
            fontSize: 14
          }}>
            <div style={{ fontWeight: 500, marginBottom: 8, color: '#ffb347' }}>
              Поддерживаемые форматы:
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
              • https://www.youtube.com/channel/UC...<br/>
              • https://www.youtube.com/c/ChannelName<br/>
              • https://www.youtube.com/@username<br/>
              • https://www.youtube.com/user/username
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={handleClose} disabled={loading}>
              Отмена
            </button>
            <button type="submit" disabled={loading || !youtubeUrl.trim()}>
              {loading ? 'Привязка...' : 'Привязать'}
            </button>
          </div>
        </form>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
          color: #fff;
        }
        
        .form-group input {
          width: 100%;
          margin-top: 4px;
          border-radius: 8px;
          border: 1.5px solid #ffb347;
          padding: 8px 12px;
          background: #232526;
          color: #fff;
          font-size: 16px;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #ffd580;
          box-shadow: 0 0 0 2px rgba(255, 179, 71, 0.2);
        }
        
        .form-group input:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .modal-actions button {
          flex: 1;
          padding: 10px 0;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }
        
        .modal-actions button[type="submit"] {
          background: #ffb347;
          border: none;
          color: #232526;
        }
        
        .modal-actions button[type="submit"]:hover:not(:disabled) {
          background: #ffd580;
        }
        
        .modal-actions button[type="button"] {
          background: none;
          border: 2px solid #ffb347;
          color: #ffb347;
        }
        
        .modal-actions button[type="button"]:hover:not(:disabled) {
          background: rgba(255, 179, 71, 0.1);
        }
        
        .modal-actions button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .error {
          color: #ff4d4f;
          font-weight: 500;
          margin-bottom: 16px;
          padding: 8px 12px;
          background: rgba(255, 77, 79, 0.1);
          border: 1px solid rgba(255, 77, 79, 0.3);
          border-radius: 6px;
        }
        
        @media (max-width: 500px) {
          .create-squad-modal-card {
            min-width: 0;
            width: 98vw;
            padding: 18px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default YouTubeLinkModal; 