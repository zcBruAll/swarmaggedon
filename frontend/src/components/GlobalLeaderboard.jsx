import { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext';
import { formatNumberFull } from '../utils/Utils';
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

const GET_LEADERBOARD = gql`
  query GlobalLeaderboard {
    global {
      leaderboard {
        user_id
        username
        score
      }
    }
  }
`

function GlobalLeaderboard() {
  const { loading, error, data } = useQuery(GET_LEADERBOARD)
  const { user, isLoggedIn } = useAuth();

  const userRank = loading ? -1 : data.global.leaderboard.findIndex(lb => lb.username === user?.username) + 1;

  return <div>
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Global leaderboard</span>
        <span className="tag">all time</span>
      </div>
      <div className="panel-body">
        <div className="scroll-y">
          {loading ? (
            <div className="lb-row">Loading leaderboard...</div>
          ) : (
            <>
              {data.global.leaderboard.map((lb, index) => (
                <div key={lb.user_id} className={`lb-row ${lb.username === user?.username ? 'highlight' : ''}`}>
                  <span className={`lb-rank ${index < 3 ? 'top' : ''}`}>#{index + 1}</span>
                  <span className="lb-name" style={{ color: lb.username === user?.username ? 'var(--blue)' : '' }}>{lb.username}{lb.username === user?.username ? ' ← you' : ''}</span>
                  <span className="lb-score">{formatNumberFull(lb.score)}</span>
                </div>
              ))}
              
              {isLoggedIn && userRank === 0 && user.rank && (
                <>
                  <hr className="divider" />
                  <div className="lb-row highlight">
                    <span className="lb-rank">#{user.rank}</span>
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
