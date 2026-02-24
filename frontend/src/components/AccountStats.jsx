import { useAuth } from '../context/AuthContext';
import { formatDurationToHours, formatNumberFull, formatNumberShort } from '../utils/Utils';

function AccountStats() {
  const { user } = useAuth();
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">My stats — {user.username}</span>
        <span className="tag">Rank #{user.rank}</span>
      </div>
      <div className="panel-body">
        <div className="stats-grid">
          <div className="stat-box" style={{ transform: 'rotate(-0.4deg)' }}>
            <div className="stat-value">{formatNumberFull(user.stats.total_games)}</div>
            <div className="stat-label">Games played</div>
          </div>
          <div className="stat-box" style={{ transform: 'rotate(0.3deg)' }}>
            <div className="stat-value">{(user.stats.win_rate * 100).toFixed(1)}%</div>
            <div className="stat-label">Win rate</div>
          </div>
          <div className="stat-box" style={{ transform: 'rotate(0.5deg)' }}>
            <div className="stat-value">{formatDurationToHours(user.stats.best_time)}</div>
            <div className="stat-label">Best run</div>
          </div>
          <div className="stat-box" style={{ transform: 'rotate(-0.3deg)' }}>
            <div className="stat-value">{formatNumberShort(user.stats.total_kills)}</div>
            <div className="stat-label">Enemies killed</div>
          </div>
          <div className="stat-box" style={{ transform: 'rotate(0.4deg)' }}>
            <div className="stat-value">{formatNumberFull(user.stats.high_score)}</div>
            <div className="stat-label">High score</div>
          </div>
          <div className="stat-box" style={{ transform: 'rotate(-0.5deg)' }}>
            <div className="stat-value">{formatDurationToHours(user.stats.avg_duration)}</div>
            <div className="stat-label">Avg survival</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountStats;