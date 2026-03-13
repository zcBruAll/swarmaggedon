import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../assets/style/components/GuestWelcome.css';

const GuestWelcome = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="panel guest-welcome-panel">
      <div className="panel-header">
        <span className="panel-title">{t('guestWelcome.panelTitle')}</span>
      </div>
      <div className="panel-body guest-body">
        <h3 className="guest-title">{t('guestWelcome.title')}</h3>
        <p className="guest-text">{t('guestWelcome.text')}</p>

        <div className="locked-features">
          <div className="locked-item">{t('guestWelcome.features.personalBest')}</div>
          <div className="locked-item">{t('guestWelcome.features.friendLeaderboards')}</div>
        </div>

        <button
          className="btn btn-primary btn-block guest-btn"
          onClick={() => navigate('/auth')}
        >
          {t('guestWelcome.joinButton')}
        </button>
      </div>
    </div>
  );
};

export default GuestWelcome;