import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { formatDurationToHours, formatNumberFull, formatNumberShort } from '../utils/Utils';

function AccountStats() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <span className="panel-title">{t('accountStats.title', { username: user.username })}</span>
        <span className="tag">
          {!user.rank
            ? t('account.noRank')
            : t('account.globalRank', { rank: user.rank })}
        </span>
      </div>
      <div className="panel-body account-stats" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="stats-grid" style={{ flex: 1 }}>
          <div className="stat-box" style={{ transform: 'rotate(-0.4deg)' }}>
            <div className="stat-value">{formatNumberFull(user.stats.total_games)}</div>
            <div className="stat-label">
              {t(user.stats.total_games === 1 ? 'accountStats.gamesPlayed_one' : 'accountStats.gamesPlayed_other')}
            </div>
          </div>
          <div className="stat-box" style={{ transform: 'rotate(0.3deg)' }}>
            <div className="stat-value">{formatNumberFull(user.stats.high_score)}</div>
            <div className="stat-label">{t('accountStats.highScore')}</div>
          </div>
          <div className="stat-box" style={{ transform: 'rotate(-0.3deg)' }}>
            <div className="stat-value">{formatNumberFull(user.stats.best_wave)}</div>
            <div className="stat-label">{t('accountStats.bestWave')}</div>
          </div>
          <div className="stat-box" style={{ transform: 'rotate(0.5deg)' }}>
            <div className="stat-value">{formatDurationToHours(user.stats.best_time)}</div>
            <div className="stat-label">{t('accountStats.bestRun')}</div>
          </div>
          <div className="stat-box" style={{ transform: 'rotate(0.4deg)' }}>
            <div className="stat-value">{formatNumberShort(user.stats.total_kills)}</div>
            <div className="stat-label">{t('accountStats.totalKills')}</div>
          </div>
          <div className="stat-box" style={{ transform: 'rotate(-0.5deg)' }}>
            <div className="stat-value">{formatDurationToHours(user.stats.total_time)}</div>
            <div className="stat-label">{t('accountStats.totalTime')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountStats;