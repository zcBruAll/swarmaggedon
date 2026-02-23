import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/style/components/GuestWelcome.css';

const GuestWelcome = () => {
  const navigate = useNavigate();

  return (
    <div className="panel guest-welcome-panel">
      <div className="panel-header">
        <span className="panel-title">Survival Records</span>
      </div>
      <div className="panel-body guest-body">
        <h3 className="guest-title">Records are locked</h3>
        <p className="guest-text">
          Connect your account to track your best runs, compete with friends, and unlock exclusive rewards.
        </p>
        
        <div className="locked-features">
          <div className="locked-item">✓ Personal Best Tracking</div>
          <div className="locked-item">✓ Friend Leaderboards</div>
        </div>

        <button 
          className="btn btn-primary btn-block guest-btn"
          onClick={() => navigate('/auth')}
        >
          Join the swarm →
        </button>
      </div>
    </div>
  );
};

export default GuestWelcome;
