import React from 'react';
import './SquadList.css';

const SquadList = ({ squads, onSquadClick }) => {
  return (
    <div className="squad-list">
      {squads.map(squad => (
        <div key={squad.id} className="squad-card" onClick={() => onSquadClick && onSquadClick(squad)}>
          <h3>{squad.name}</h3>
          {squad.tag && <div className="squad-tag" style={{ color: '#888', fontSize: 14, marginBottom: 4 }}>Тег: {squad.tag}</div>}
          <p>Лидер: {squad.leader?.username || 'Неизвестно'}</p>
          <p>Участников: {squad.members?.length || 0}</p>
        </div>
      ))}
    </div>
  );
};

export default SquadList;