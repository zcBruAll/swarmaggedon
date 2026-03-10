import { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext';
import { formatNumberFull } from '../utils/Utils';
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

const SCOPE = {
  ALL_TIME: "all time",
  WEEKLY: "weekly",
  DAILY: "daily"
}

const GET_LEADERBOARD_ALLTIME = gql`
  query GlobalLeaderboardAT {
    global {
      leaderboard: alltime_leaderboard {
        leaderboard {
          user_id
          username
          score
        }
        user_rank
        user_score
      }
    }
  }
`

const GET_LEADERBOARD_WEEKLY = gql`
  query GlobalLeaderboardW {
    global {
      leaderboard: weekly_leaderboard {
        leaderboard {
          user_id
          username
          score
        }
        user_rank
        user_score
      }
    }
  }
`

const GET_LEADERBOARD_DAILY = gql`
  query GlobalLeaderboardD {
    global {
      leaderboard: daily_leaderboard {
        leaderboard {
          user_id
          username
          score
        }
        user_rank
        user_score
      }
    }
  }
`

function GlobalLeaderboard() {
  const [scope, setScope] = useState(SCOPE.ALL_TIME)
  const { loading, error, data } = useQuery(scope == SCOPE.DAILY ? GET_LEADERBOARD_DAILY : scope == SCOPE.WEEKLY ? GET_LEADERBOARD_WEEKLY : GET_LEADERBOARD_ALLTIME)
  const { user, isLoggedIn } = useAuth();
  const [timeLeft, setTimeLeft] = useState("");

  const leaderboard = data?.global.leaderboard.leaderboard || [];
  const userRank = data?.global.leaderboard.user_rank || -1;

  const changeScope = () => {
    console.log(leaderboard, userRank, data)
    if (scope === SCOPE.ALL_TIME) setScope(SCOPE.DAILY);
    else if (scope === SCOPE.DAILY) setScope(SCOPE.WEEKLY);
    else setScope(SCOPE.ALL_TIME);
  }

  useEffect(() => {
    const updateCountdown = () => {
      if (scope === SCOPE.ALL_TIME) {
        setTimeLeft("");
        return;
      }

      const now = new Date();
      const target = new Date();
      target.setUTCHours(2, 0, 0, 0);

      if (scope === SCOPE.DAILY) {
        if (now >= target) {
          target.setUTCDate(target.getUTCDate() + 1);
        }
      } else if (scope === SCOPE.WEEKLY) {
        // Find next Sunday 2AM UTC
        const daysUntilSunday = (7 - now.getUTCDay()) % 7;
        target.setUTCDate(target.getUTCDate() + daysUntilSunday);
        if (now >= target && daysUntilSunday === 0) {
          target.setUTCDate(target.getUTCDate() + 7);
        }
      }

      const diff = target - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}d ${hours % 24}h ${minutes}m`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [scope]);

  return <div>
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Global leaderboard</span>
        <div style={{ display: 'flex', gap: '5px' }}>
          <span className="tag">{scope}</span>
          <span className="tag clickable" onClick={changeScope}>&gt;</span>
        </div>
      </div>
      <div className="panel-body">
        {timeLeft && (
          <div style={{ fontSize: '0.8rem', opacity: 0.7, textAlign: 'right', padding: '0 10px 5px' }}>
            resets in {timeLeft}
          </div>
        )}
        <div className="scroll-y">
          {loading ? (
            <div className="lb-row">Loading leaderboard...</div>
          ) : (
            <>
              {leaderboard.map((lb, index) => (
                <div key={lb.user_id} className={`lb-row ${lb.username === user?.username ? 'highlight' : ''}`}>
                  <span className={`lb-rank ${index < 3 ? 'top' : ''}`}>#{index + 1}</span>
                  <span className="lb-name" style={{ color: lb.username === user?.username ? 'var(--blue)' : '' }}>{lb.username}{lb.username === user?.username ? ' ← you' : ''}</span>
                  <span className="lb-score">{formatNumberFull(lb.score)}</span>
                </div>
              ))}
              
              {isLoggedIn && userRank > 10 && (
                <>
                  <hr className="divider" />
                  <div className="lb-row highlight">
                    <span className="lb-rank">#{userRank}</span>
                    <span className="lb-name" style={{ color: 'var(--blue)' }}>{user?.username} ← you</span>
                    <span className="lb-score">{formatNumberFull(user?.stats.high_score)}</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  </div>
}
export default GlobalLeaderboard;
