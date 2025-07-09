import React, { useState } from 'react';
import axios from 'axios';
import './CreateSquadModal.css';

const CreateSquadModal = ({ onClose, onSquadCreated }) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tagError, setTagError] = useState(null);

  const validateTag = (value) => {
    if (!value) return 'Тег обязателен';
    if (!/^[A-Za-z0-9]{2,8}$/.test(value)) return 'Только латиница и цифры, 2-8 символов';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tagErr = validateTag(tag);
    setTagError(tagErr);
    if (tagErr) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/squads', { name, tag, description }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      onSquadCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка создания отряда');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.2)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 16,
          boxShadow: '0 6px 24px 0 rgba(255,179,71,0.16), 0 2px 10px rgba(0,0,0,0.14)',
          border: '2px solid #ffb347',
          padding: '32px 24px 24px 24px',
          minWidth: 320,
          maxWidth: '90vw',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          animation: 'slideDown 0.3s',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: 18, 
            right: 18, 
            background: 'none', 
            border: 'none', 
            color: '#ffb347', 
            fontSize: 22, 
            cursor: 'pointer', 
            zIndex: 2 
          }}
        >
          &times;
        </button>
        <h2 style={{ 
          textAlign: 'center', 
          color: '#ffb347', 
          fontWeight: 700, 
          marginBottom: 18,
          fontSize: '1.3rem'
        }}>
          Создать новый отряд
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontWeight: 500, color: '#fff' }}>Название отряда <span style={{ color: '#ffb347' }}>*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={32}
              style={{ 
                width: '100%', 
                marginTop: 4, 
                borderRadius: 8, 
                border: '1.5px solid #ffb347', 
                padding: '8px 12px', 
                background: '#232526', 
                color: '#fff', 
                fontSize: 16,
                outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 500, color: '#fff' }}>Тег <span style={{ color: '#ffb347' }}>*</span> <span style={{ fontSize: 13, color: '#bdbdbd' }}>(2-8 символов, латиница/цифры)</span></label>
            <input
              type="text"
              value={tag}
              onChange={e => { setTag(e.target.value.toUpperCase()); setTagError(null); }}
              required
              maxLength={8}
              style={{ 
                width: '100%', 
                marginTop: 4, 
                borderRadius: 8, 
                border: tagError ? '1.5px solid #ff4d4f' : '1.5px solid #ffb347', 
                padding: '8px 12px', 
                background: '#232526', 
                color: '#fff', 
                fontSize: 16,
                outline: 'none'
              }}
            />
            {tagError && <div style={{ color: '#ff4d4f', fontSize: 13, marginTop: 2 }}>{tagError}</div>}
          </div>
          <div>
            <label style={{ fontWeight: 500, color: '#fff' }}>Описание</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              style={{ 
                width: '100%', 
                marginTop: 4, 
                borderRadius: 8, 
                border: '1.5px solid #ffb347', 
                padding: '8px 12px', 
                background: '#232526', 
                color: '#fff', 
                fontSize: 15, 
                resize: 'vertical',
                outline: 'none'
              }}
            />
          </div>
          {error && <div style={{ color: '#ff4d4f', fontWeight: 500, marginTop: -8 }}>{error}</div>}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 12, 
            marginTop: 8 
          }}>
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading} 
              style={{ 
                background: 'none',
                border: '2px solid #ffb347',
                color: '#ffb347',
                borderRadius: 8,
                padding: '10px 20px',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                transition: 'background 0.2s',
                minWidth: '100px'
              }}
              onMouseEnter={e => e.target.style.background = 'rgba(255, 179, 71, 0.1)'}
              onMouseLeave={e => e.target.style.background = 'none'}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              disabled={loading || !name || !tag || !!tagError} 
              style={{ 
                background: loading || !name || !tag || !!tagError ? '#666' : '#ffb347',
                border: 'none',
                color: '#232526',
                borderRadius: 8,
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: 16,
                cursor: loading || !name || !tag || !!tagError ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                minWidth: '100px',
                opacity: loading || !name || !tag || !!tagError ? 0.6 : 1
              }}
              onMouseEnter={e => {
                if (!loading && name && tag && !tagError) {
                  e.target.style.background = '#e6a23c';
                }
              }}
              onMouseLeave={e => {
                if (!loading && name && tag && !tagError) {
                  e.target.style.background = '#ffb347';
                }
              }}
            >
              {loading ? 'Создание...' : 'Создать'}
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
          from { transform: translateY(-40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CreateSquadModal;