import React, { useEffect, useState } from 'react';
import axios from 'axios';

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const getPlayerName = (players, id) => {
  const p = players.find(p => p.entityId === id || p.playerIdentity === id);
  return p ? (p.name || p.playerIdentity) : id;
};

const getFactionName = (factions, key) => {
  const f = factions?.find(f => f.factionKey === key);
  return f ? f.factionKey : key;
};

const MatchHistoryPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/match-history');
        setMatches(res.data);
      } catch (e) {
        setError('Ошибка загрузки истории матчей');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h2 style={{ color: '#ffb347', textAlign: 'center', marginBottom: 32 }}>История матчей</h2>
      {loading && <div style={{ textAlign: 'center', color: '#bbb' }}>Загрузка...</div>}
      {error && <div style={{ textAlign: 'center', color: '#ff4d4f' }}>{error}</div>}
      {!loading && !error && matches.length === 0 && (
        <div style={{ textAlign: 'center', color: '#bbb' }}>Нет данных о матчах</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {matches.map(match => (
          <div key={match.sessionId} style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 14, boxShadow: '0 2px 12px #0008', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#ffb347' }}>
                {match.missionName || 'Сценарий неизвестен'}
              </div>
              <div style={{ color: '#bbb', fontSize: 15 }}>{formatDate(match.date)}</div>
            </div>
            <div style={{ marginBottom: 10, color: '#fff', fontSize: 15 }}>
              <b>Участники:</b> {match.players.map(p => `${p.name || p.playerIdentity} (${p.faction || '??'})`).join(', ')}
            </div>
            <div style={{ marginBottom: 10, color: '#fff', fontSize: 15 }}>
              <b>Задачи фракций:</b>
              <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                {match.factionObjectives && match.factionObjectives.length > 0 ? match.factionObjectives.map((f, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    <span style={{ color: '#ffb347', fontWeight: 600 }}>{f.factionKey}</span> — {f.resultName} (очки: {f.resultScore})
                    {f.objectives && f.objectives.length > 0 && (
                      <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                        {f.objectives.map((o, j) => (
                          <li key={j} style={{ color: o.completed ? '#4caf50' : '#ff4d4f' }}>
                            {o.name} — {o.completed ? 'Выполнено' : 'Не выполнено'} (очки: {o.score})
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )) : <li style={{ color: '#bbb' }}>Нет информации</li>}
              </ul>
            </div>
            <div style={{ color: '#fff', fontSize: 15 }}>
              <b>Убийства:</b>
              <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                {(!match.kills || match.kills.length === 0) && <li style={{ color: '#bbb' }}>Нет убийств</li>}
                {match.kills && match.kills.map((k, i) => {
                  const killer = getPlayerName(match.players, k.killerId);
                  const victim = getPlayerName(match.players, k.victimId);
                  let type = 'Убийство';
                  let color = '#fff';
                  if (k.isSuicide) { type = 'Суицид'; color = '#ff4d4f'; }
                  else if (k.isTeamkill) { type = 'Тимкилл'; color = '#ffd700'; }
                  return (
                    <li key={i} style={{ marginBottom: 2 }}>
                      <span style={{ color }}>{type}:</span>{' '}
                      {killer}{type === 'Суицид' ? '' : ' → ' + victim}
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
        ))}
      </div>
    </div>
  );
};

export default MatchHistoryPage; 