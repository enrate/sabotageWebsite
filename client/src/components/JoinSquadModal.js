import React from 'react';

const JoinSquadModal = ({ squads, onClose, onJoinSquad }) => {
  const handleJoin = (squadId) => {
    onJoinSquad(squadId);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Вступить в отряд</h2>
        <div className="squad-options">
          {squads.map(squad => (
            <div key={squad.id} className="squad-option">
              <h3>{squad.name}</h3>
              <p>Участников: {squad.members?.length || 0}</p>
              <button onClick={() => handleJoin(squad.id)}>Вступить</button>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
};

export default JoinSquadModal;