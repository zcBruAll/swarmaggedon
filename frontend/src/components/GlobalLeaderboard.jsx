import { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext';
import { formatNumberFull } from '../utils/Utils';
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";

const SCOPE_KEYS = {
  ALL_TIME: "allTime",
  WEEKLY: "weekly",
  DAILY: "daily",
};

const GET_LEADERBOARD_ALLTIME = gql`
  query GlobalLeaderboardAT {
    global {
      leaderboard: alltime_leaderboard {
        leaderboard { user_id username score }
        user_rank
        user_score
      }
    }
  }
`;

const GET_LEADERBOARD_WEEKLY = gql`
  query GlobalLeaderboardW {
    global {
      leaderboard: weekly_leaderboard {
        leaderboard { user_id username score }
        user_rank
        user_score
      }
    }
  }
`;

const GET_LEADERBOARD_DAILY = gql`
  query GlobalLeaderboardD {
    global {
      leaderboard: daily_leaderboard {
        leaderboard { user_id username score }
        user_rank
        user_score
      }
    }
  }
`;

function GlobalLeaderboard() {
  const { t } = useTranslation();
  const [scopeKey, setScopeKey] = useState(SCOPE_KEYS.ALL_TIME);
  const { loading, data } = useQuery(
    scopeKey === SCOPE_KEYS.DAILY
      ? GET_LEADERBOARD_DAILY
      : scopeKey === SCOPE_KEYS.WEEKLY
        ? GET_LEADERBOARD_WEEKLY
        : GET_LEADERBOARD_ALLTIME
  );
  const { user, isLoggedIn } = useAuth();
  const [timeLeft, setTimeLeft] = useState("");

  const leaderboard = data?.global.leaderboard.leaderboard || [];
  const userRank = data?.global.leaderboard.user_rank || -1;

  const changeScope = () => {
    if (scopeKey === SCOPE_KEYS.ALL_TIME) setScopeKey(SCOPE_KEYS.DAILY);
    else if (scopeKey === SCOPE_KEYS.DAILY) setScopeKey(SCOPE_KEYS.WEEKLY);
    else setScopeKey(SCOPE_KEYS.ALL_TIME);
  };

  useEffect(() => {
    const updateCountdown = () => {
      if (scopeKey === SCOPE_KEYS.ALL_TIME) { setTimeLeft(""); return; }

      const now = new Date();
      const target = new Date();
      target.setUTCHours(2, 0, 0, 0);

      if (scopeKey === SCOPE_KEYS.DAILY) {
        if (now >= target) target.setUTCDate(target.getUTCDate() + 1);
      } else {
        const daysUntilSunday = (7 - now.getUTCDay()) % 7;
        target.setUTCDate(target.getUTCDate() + daysUntilSunday);
        if (now >= target && daysUntilSunday === 0) target.setUTCDate(target.getUTCDate() + 7);
      }

      const diff = target - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(t('leaderboard.timeLeft.daysHoursMinutes', { days, hours: hours % 24, minutes }));
      } else {
        setTimeLeft(t('leaderboard.timeLeft.hoursMinutes', { hours, minutes }));
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [scopeKey, t]);

  return (
    <div>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('leaderboard.title')}</span>
          <div style={{ display: 'flex', gap: '5px' }}>
            <span className="tag">{t(`leaderboard.scopes.${scopeKey}`)}</span>
            <span className="tag clickable" onClick={changeScope}>&gt;</span>
          </div>
        </div>
        <div className="panel-body">
          {timeLeft && (
            <div style={{ fontSize: '0.8rem', opacity: 0.7, textAlign: 'right', margin: "-15px 0 -5px" }}>
              {t('leaderboard.resetsIn', { time: timeLeft })}
            </div>
          )}
          <div className="scroll-y">
            {loading ? (
              <div className="lb-row">{t('leaderboard.loading')}</div>
            ) : (
              <>
                {leaderboard.map((lb, index) => (
                  <Link key={lb.user_id} to={`/profile/${lb.username}`} className="list-item-link">
                    <div className={`lb-row ${lb.username === user?.username ? 'highlight' : ''}`}>
                      <span className={`lb-rank ${index < 3 ? 'top' : ''}`}>#{index + 1}</span>
                      <span className="lb-name" style={{ color: lb.username === user?.username ? 'var(--blue)' : '' }}>
                        {lb.username}{lb.username === user?.username ? t('leaderboard.you') : ''}
                      </span>
                      <span className="lb-score">{formatNumberFull(lb.score)}</span>
                    </div>
                  </Link>
                ))}

                {isLoggedIn && userRank > 10 && (
                  <>
                    <hr className="divider" />
                    <Link to={`/profile/${user?.username}`} className="list-item-link">
                      <div className="lb-row highlight">
                        <span className="lb-rank">#{userRank}</span>
                        <span className="lb-name" style={{ color: 'var(--blue)' }}>
                          {user?.username}{t('leaderboard.you')}
                        </span>
                        <span className="lb-score">{formatNumberFull(user?.stats.high_score)}</span>
                      </div>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GlobalLeaderboard;
