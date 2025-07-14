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

const getFactionPlayers = (players, factionKey) => {
  return players.filter(p => p.faction === factionKey);
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
        // Собираю все уникальные factionKey
        const allKeys = new Set();
        res.data.forEach(match => {
          (match.factionObjectives || []).forEach(f => {
            if (f.factionKey) allKeys.add(f.factionKey);
          });
        });
        // eslint-disable-next-line
        console.log('Уникальные factionKey:', Array.from(allKeys));
      } catch (e) {
        setError('Ошибка загрузки истории матчей');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <h2 style={{ color: '#ffb347', textAlign: 'center', marginBottom: 32 }}>История матчей</h2>
      {loading && <div style={{ textAlign: 'center', color: '#bbb' }}>Загрузка...</div>}
      {error && <div style={{ textAlign: 'center', color: '#ff4d4f' }}>{error}</div>}
      {!loading && !error && matches.length === 0 && (
        <div style={{ textAlign: 'center', color: '#bbb' }}>Нет данных о матчах</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {matches.map(match => {
          // Только фракции с задачами
          const factionsWithObjectives = (match.factionObjectives || []).filter(f => f.objectives && f.objectives.length > 0);
          return (
            <div key={match.sessionId} style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 14, boxShadow: '0 2px 12px #0008', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#ffb347' }}>
                  {match.missionName || 'Сценарий неизвестен'}
                </div>
                <div style={{ color: '#bbb', fontSize: 15 }}>{formatDate(match.date)}</div>
              </div>
              <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap' }}>
                {factionsWithObjectives.map((f, i) => (
                  <div key={i} style={{ flex: '1 1 320px', minWidth: 260, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 18 }}>
                    <div style={{ color: '#ffb347', fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{f.factionKey}</div>
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
                        <li key={idx} style={{ color: '#fff', fontSize: 15 }}>{p.name || p.playerIdentity}</li>
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
          );
        })}
      </div>
    </div>
  );
};

export default MatchHistoryPage; 