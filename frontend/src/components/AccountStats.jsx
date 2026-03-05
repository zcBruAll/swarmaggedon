import { useAuth } from '../context/AuthContext';
import { formatDurationToHours, formatNumberFull, formatNumberShort } from '../utils/Utils';

function AccountStats() {
  const { user } = useAuth();
  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <span className="panel-title">My stats — {user.username}</span>
        <span className="tag">{!user.rank ? "No rank yet" : "Rank #" + user.rank}</span>
      </div>
      <div className="panel-body account-stats" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="stats-grid" style={{ flex: 1 }}>
          <div className="stat-box" style={{ transform: 'rotate(-0.4deg)' }}>
            <div className="stat-value">{formatNumberFull(user.stats.total_games)}</div>
            <div className="stat-label">Game{user.stats.total_games === 1 ? "" : "s"} played</div>
          </div>
          <div className="stat-box" style={{ transform: 'rotate(0.3deg)' }}>
            <div className="stat-value">{formatNumberFull(user.stats.high_score)}</div>
            <div className="stat-label">High score</div>
          </div>
          <div className="stat-box" style={{ transform: 'rotate(-0.3deg)' }}>
            <div className="stat-value">{formatNumberFull(user.stats.best_wave)}</div>
            <div className="stat-label">Best wave</div>
          </div>
          <div className="stat-box" style={{ transform: 'rotate(0.5deg)' }}>
            <div className="stat-value">{formatDurationToHours(user.stats.best_time)}</div>
            <div className="stat-label">Best run</div>
          </div>
          <div className="stat-box" style={{ transform: 'rotate(0.4deg)' }}>
            <div className="stat-value">{formatNumberShort(user.stats.total_kills)}</div>
            <div className="stat-label">Total kills</div>
          </div>
          <div className="stat-box" style={{ transform: 'rotate(-0.5deg)' }}>
            <div className="stat-value">{formatDurationToHours(user.stats.total_time)}</div>
            <div className="stat-label">Total time survived</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountStats;