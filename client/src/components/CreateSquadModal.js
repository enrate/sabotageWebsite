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
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="create-squad-modal-card" style={{ maxWidth: 420, minWidth: 320, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#ffb347', fontSize: 22, cursor: 'pointer', zIndex: 2 }}>&times;</button>
        <h2 style={{ textAlign: 'center', color: '#ffb347', fontWeight: 700, marginBottom: 18 }}>Создать новый отряд</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontWeight: 500 }}>Название отряда <span style={{ color: '#ffb347' }}>*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={32}
              style={{ width: '100%', marginTop: 4, borderRadius: 8, border: '1.5px solid #ffb347', padding: '8px 12px', background: '#232526', color: '#fff', fontSize: 16 }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 500 }}>Тег <span style={{ color: '#ffb347' }}>*</span> <span style={{ fontSize: 13, color: '#bdbdbd' }}>(2-8 символов, латиница/цифры)</span></label>
            <input
              type="text"
              value={tag}
              onChange={e => { setTag(e.target.value.toUpperCase()); setTagError(null); }}
              required
              maxLength={8}
              style={{ width: '100%', marginTop: 4, borderRadius: 8, border: tagError ? '1.5px solid #ff4d4f' : '1.5px solid #ffb347', padding: '8px 12px', background: '#232526', color: '#fff', fontSize: 16 }}
            />
            {tagError && <div style={{ color: '#ff4d4f', fontSize: 13, marginTop: 2 }}>{tagError}</div>}
          </div>
          <div>
            <label style={{ fontWeight: 500 }}>Описание</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              style={{ width: '100%', marginTop: 4, borderRadius: 8, border: '1.5px solid #ffb347', padding: '8px 12px', background: '#232526', color: '#fff', fontSize: 15, resize: 'vertical' }}
            />
          </div>
          {error && <div style={{ color: '#ff4d4f', fontWeight: 500, marginTop: -8 }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} disabled={loading} style={{ flex: 1, background: 'none', border: '2px solid #ffb347', color: '#ffb347', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer', transition: 'background 0.2s' }}>Отмена</button>
            <button type="submit" disabled={loading || !name || !tag || !!tagError} style={{ flex: 1, background: '#ffb347', border: 'none', color: '#232526', borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>{loading ? 'Создание...' : 'Создать'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSquadModal;