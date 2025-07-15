import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const getPlayerName = (players, id) => {
  let p = players.find(p => p.entityId === id);
  if (!p) p = players.find(p => p.playerIdentity === id);
  if (!p) p = players.find(p => String(p.PlayerId) === String(id));
  return p ? (p.name || p.playerIdentity || p.PlayerId || id) : id;
};

const getFactionPlayers = (players, factionKey) => {
  return players.filter(p => p.faction === factionKey);
};

const CARD_BG = 'rgba(20, 20, 20, 0.82)';
const CARD_SHADOW = '0 8px 32px 0 rgba(0,0,0,0.28), 0 2px 10px rgba(255,179,71,0.10)';
const ACCENT = '#ffb347';
const BORDER = '2px solid #ffb347';
const IMAGE_PLACEHOLDER = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80';
const CARD_BORDER = '2px solid #222';

const PAGE_SIZE = 8;

const cleanMissionName = (name) => name ? name.replace(/^[0-9]+_/, '') : '';

const MatchHistoryPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState({});
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const offsetRef = useRef(0);

  // Фильтры
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [missionNames, setMissionNames] = useState([]); // выбранные сценарии
  const [nicknameInput, setNicknameInput] = useState('');
  const [nicknames, setNicknames] = useState([]); // выбранные никнеймы
  const [allMissions, setAllMissions] = useState([]); // все уникальные сценарии

  // Получаем все уникальные сценарии (один раз)
  useEffect(() => {
    const fetchAllMissions = async () => {
      try {
        const res = await axios.get('/api/match-history?limit=1000&offset=0');
        const names = Array.from(new Set(res.data.matches.map(m => m.missionName).filter(Boolean)));
        setAllMissions(names);
      } catch {}
    };
    fetchAllMissions();
  }, []);

  // Загрузка матчей с учётом фильтров
  const fetchMatches = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setError(null);
      setMatches([]);
      setHasMore(true);
      offsetRef.current = 0;
    } else {
      setIsFetchingMore(true);
    }
    try {
      const params = {
        limit: PAGE_SIZE,
        offset: offsetRef.current,
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (missionNames.length > 0) params.missionNames = missionNames;
      if (nicknames.length > 0) params.nicknames = nicknames;
      const res = await axios.get('/api/match-history', { params });
      if (reset) {
        setMatches(res.data.matches);
        setTotalCount(res.data.totalCount);
        setHasMore(res.data.matches.length < res.data.totalCount);
        offsetRef.current = res.data.matches.length;
      } else {
        setMatches(prev => [...prev, ...res.data.matches]);
        offsetRef.current += res.data.matches.length;
        setHasMore(offsetRef.current < res.data.totalCount);
      }
    } catch (e) {
      setError('Ошибка загрузки истории матчей');
      setHasMore(false);
    } finally {
      if (reset) setLoading(false);
      else setIsFetchingMore(false);
    }
  };

  // Первичная загрузка
  useEffect(() => {
    fetchMatches(true);
    // eslint-disable-next-line
  }, []);

  // Ленивая подгрузка при прокрутке вниз
  useEffect(() => {
    const handleScroll = () => {
      if (loading || isFetchingMore || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        fetchMatches(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line
  }, [matches, loading, isFetchingMore, hasMore]);

  // Сброс и загрузка при изменении фильтров
  useEffect(() => {
    fetchMatches(true);
    // eslint-disable-next-line
  }, [startDate, endDate, missionNames, nicknames]);

  const handleAddNickname = (e) => {
    e.preventDefault();
    const val = nicknameInput.trim();
    if (val && !nicknames.includes(val)) {
      setNicknames([...nicknames, val]);
    }
    setNicknameInput('');
  };
  const handleRemoveNickname = (nick) => {
    setNicknames(nicknames.filter(n => n !== nick));
  };

  const toggleOpen = (sessionId) => {
    setOpen(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
  };

  const renderPlayer = (players, id) => {
    const player = players.find(p => p.playerIdentity === id || p.entityId === id || String(p.PlayerId) === String(id));
    if (!player) return <b>{id}</b>;
    return player.userId ? (
      <Link to={`/profile/${player.userId}`} style={{ color: ACCENT, textDecoration: 'none', fontWeight: 600 }}>{player.name || player.playerIdentity || player.PlayerId || id}</Link>
    ) : (
      <b>{player.name || player.playerIdentity || player.PlayerId || id}</b>
    );
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <h2 style={{ color: ACCENT, textAlign: 'center', marginBottom: 32, letterSpacing: 1, fontWeight: 800, fontSize: 32 }}>История матчей</h2>
      {/* Фильтры */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center', justifyContent: 'center' }}>
        <div>
          <label style={{ color: '#fff', fontWeight: 500, marginRight: 6 }}>Дата с:</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: 4, borderRadius: 4, border: '1px solid #888', background: '#222', color: '#fff' }} />
        </div>
        <div>
          <label style={{ color: '#fff', fontWeight: 500, marginRight: 6 }}>по:</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: 4, borderRadius: 4, border: '1px solid #888', background: '#222', color: '#fff' }} />
        </div>
        <div>
          <label style={{ color: '#fff', fontWeight: 500, marginRight: 6 }}>Сценарии:</label>
          <select multiple value={missionNames} onChange={e => setMissionNames(Array.from(e.target.selectedOptions, o => o.value))} style={{ minWidth: 160, padding: 4, borderRadius: 4, border: '1px solid #888', background: '#222', color: '#fff', height: 32 + 22 * Math.min(4, allMissions.length) }}>
            {allMissions.map(m => (
              <option key={m} value={m}>{cleanMissionName(m)}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ color: '#fff', fontWeight: 500, marginRight: 6 }}>Игроки:</label>
          <form onSubmit={handleAddNickname} style={{ display: 'inline' }}>
            <input type="text" value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} placeholder="Никнейм" style={{ padding: 4, borderRadius: 4, border: '1px solid #888', background: '#222', color: '#fff', minWidth: 90 }} />
            <button type="submit" style={{ marginLeft: 4, padding: '4px 10px', borderRadius: 4, border: 'none', background: ACCENT, color: '#222', fontWeight: 700, cursor: 'pointer' }}>+</button>
          </form>
          {nicknames.length > 0 && (
            <span style={{ marginLeft: 8 }}>
              {nicknames.map(nick => (
                <span key={nick} style={{ background: ACCENT, color: '#222', borderRadius: 4, padding: '2px 8px', marginRight: 4, fontWeight: 600, display: 'inline-block' }}>
                  {nick} <span style={{ cursor: 'pointer', marginLeft: 2, color: '#b00', fontWeight: 900 }} onClick={() => handleRemoveNickname(nick)}>×</span>
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
      {loading && <div style={{ textAlign: 'center', color: '#bbb' }}>Загрузка...</div>}
      {error && <div style={{ textAlign: 'center', color: '#ff4d4f' }}>{error}</div>}
      {!loading && !error && matches.length === 0 && (
        <div style={{ textAlign: 'center', color: '#bbb' }}>Нет данных о матчах</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {matches.map(match => {
          const factionsWithObjectives = (match.factionObjectives || []).filter(f => f.objectives && f.objectives.length > 0);
          const img = match.missionImage || IMAGE_PLACEHOLDER;
          const playerIdToName = {};
          match.players.forEach(p => {
            if (p.PlayerId !== undefined) playerIdToName[p.PlayerId] = p.name || p.playerIdentity;
            if (p.entityId !== undefined) playerIdToName[p.entityId] = p.name || p.playerIdentity;
            if (p.playerIdentity !== undefined) playerIdToName[p.playerIdentity] = p.name || p.playerIdentity;
          });
          return (
            <div
              key={match.sessionId}
              style={{
                background: CARD_BG,
                border: open[match.sessionId] ? BORDER : CARD_BORDER,
                borderRadius: 22,
                boxShadow: CARD_SHADOW,
                padding: 0,
                marginBottom: 18,
                position: 'relative',
                overflow: 'hidden',
                minHeight: 90,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transition: 'box-shadow 0.25s, border 0.25s',
              }}
            >
              {/* Кликабельная мини-карточка */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 18, padding: 18, paddingBottom: 10, cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleOpen(match.sessionId)}
              >
                <div style={{ flexShrink: 0, width: 70, height: 70, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px #0007', border: '2px solid #444', background: '#222' }}>
                  <img src={img} alt="mission" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 20, color: ACCENT, letterSpacing: 0.5, marginBottom: 2 }}>{cleanMissionName(match.missionName) || 'Сценарий неизвестен'}</div>
                  <div style={{ color: '#bbb', fontSize: 15, marginBottom: 2 }}>{formatDate(match.date)}</div>
                  <div style={{ color: '#fff', fontSize: 15, marginTop: 2 }}>
                    <b style={{ color: ACCENT }}>Участники:</b>{' '}
                    {match.players.map((p, idx) => (
                      <React.Fragment key={p.playerIdentity ?? p.entityId ?? p.PlayerId ?? idx}>
                        <b>{p.name || p.playerIdentity || p.PlayerId || (p.entityId ?? idx)}</b>
                        {idx < match.players.length - 1 && ', '}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 28, color: ACCENT, userSelect: 'none', marginLeft: 12, transition: 'transform 0.2s', transform: open[match.sessionId] ? 'rotate(180deg)' : 'none' }}>
                  ▼
                </div>
              </div>
              {/* Развёрнутая часть — не реагирует на клики для закрытия */}
              <div
                style={{
                  maxHeight: open[match.sessionId] ? 2000 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.45s cubic-bezier(.4,2,.6,1)',
                  background: open[match.sessionId] ? 'rgba(255,179,71,0.03)' : 'none',
                  borderTop: open[match.sessionId] ? '1.5px solid #333' : 'none',
                  boxShadow: open[match.sessionId] ? '0 2px 12px #0004' : 'none'
                }}
              >
                {open[match.sessionId] && (
                  <div style={{ padding: 24, paddingTop: 10 }}>
                    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap' }}>
                      {factionsWithObjectives.map((f, i) => (
                        <div key={i} style={{ flex: '1 1 320px', minWidth: 260, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 18, border: '1.5px solid #333' }}>
                          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 17, marginBottom: 8 }}>
                            {f.factionKey}
                            <span style={{ color: f.resultName && f.resultName.toLowerCase().includes('victory') ? '#4caf50' : '#ff4d4f', fontWeight: 600, marginLeft: 8 }}>
                              {f.resultName && f.resultName.toLowerCase().includes('victory') ? ' - Победа' : f.resultName && f.resultName.toLowerCase().includes('loss') ? ' - Поражение' : ''}
                            </span>
                          </div>
                          <div style={{ color: '#fff', fontWeight: 500, marginBottom: 6 }}>Задачи:</div>
                          <ul style={{ margin: 0, paddingLeft: 18, marginBottom: 10 }}>
                            {f.objectives.map((o, j) => (
                              <li key={j} style={{ color: o.completed ? '#4caf50' : '#ff4d4f', fontSize: 15 }}>
                                {o.name} — {o.completed ? 'Выполнено' : 'Не выполнено'} (очки: {o.score})
                              </li>
                            ))}
                          </ul>
                          <div style={{ color: '#fff', fontWeight: 500, marginBottom: 4 }}>Участники:</div>
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {getFactionPlayers(match.players, f.factionKey).map((p, idx) => (
                              <li key={p.playerIdentity ?? p.entityId ?? p.PlayerId ?? idx}>
                                {renderPlayer(match.players, p.playerIdentity ?? p.entityId ?? p.PlayerId ?? idx)}
                              </li>
                            ))}
                            {getFactionPlayers(match.players, f.factionKey).length === 0 && <li style={{ color: '#bbb', fontSize: 15 }}>Нет участников</li>}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div style={{ color: '#fff', fontSize: 15, marginTop: 18 }}>
                      <b>История убийств:</b>
                      <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                        {(!match.kills || match.kills.length === 0) && <li style={{ color: '#bbb' }}>Нет убийств</li>}
                        {match.kills && match.kills.map((k, i) => {
                          const killer = renderPlayer(match.players, k.killerId);
                          const victim = renderPlayer(match.players, k.victimId);
                          let type = 'Убийство';
                          let color = '#fff';
                          if (k.isSuicide) { type = 'Суицид'; color = '#ff4d4f'; }
                          else if (k.isTeamkill) { type = 'Тимкилл'; color = '#ffd700'; }
                          return (
                            <li key={i} style={{ marginBottom: 2 }}>
                              <span style={{ color }}>{type}:</span>{' '}
                              <b>{killer}</b>{type === 'Суицид' ? '' : ' → '}<b>{type === 'Суицид' ? '' : victim}</b>
                              {' '}<span style={{ color: '#bbb', fontSize: 13 }}>({k.systemTime ? formatDate(new Date(k.systemTime * 1000)) : ''})</span>
                              {k.killerFaction && k.victimFaction && (
                                <span style={{ color: '#bbb', fontSize: 13 }}> [{k.killerFaction} → {k.victimFaction}]</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {isFetchingMore && (
        <div style={{ textAlign: 'center', color: '#bbb', margin: 16 }}>Загрузка...</div>
      )}
      {!hasMore && matches.length > 0 && (
        <div style={{ textAlign: 'center', color: '#bbb', margin: 16 }}>Все матчи загружены</div>
      )}
    </div>
  );
};

export default MatchHistoryPage; 