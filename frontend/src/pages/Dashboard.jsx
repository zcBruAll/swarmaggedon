import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import GlobalStats from '../components/GlobalStats'
import AccountStats from '../components/AccountStats'
import FriendsStats from '../components/FriendsStats'
import GlobalLeaderboard from '../components/GlobalLeaderboard'
import '../assets/style/pages/Dashboard.css'
import GuestWelcome from '../components/GuestWelcome'
import { useAuth } from '../context/AuthContext'
import { formatRelativeTime, formatToRealTime, formatNumberShort } from '../utils/Utils'

const Dashboard = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, loading } = useAuth();

  return (
    <div id="section-dashboard" className="section-content active">
      <div className="main" style={{ alignItems: 'stretch' }}>
        {/* Global stats bar : top */}
        <GlobalStats />

        {/* Global leaderboard*/}
        <div style={{ gridRow: 'span 2' }}>
          <GlobalLeaderboard />
        </div>

        { isLoggedIn ? 
          <>
            <AccountStats />
            <FriendsStats />
          </> : <GuestWelcome />}


        <div className="play-section">
          <div>
            <div className="play-title">Ready to survive? ✦</div>
            <div className="play-sub">
              {isLoggedIn ? (
                !user.last_run?.date ? "You've never played before" :
                  <>
                    Last run <strong>{formatRelativeTime(user.last_run?.date)}</strong>, reached wave <strong>{user.last_run.wave}</strong> in <strong>{formatToRealTime(user.last_run.duration)}</strong> and scoring <strong>{formatNumberShort(user.last_run.score)}</strong> points.
                  </>
              ) : "Create an account to see your stats !"}
            </div>
          </div>
          <button
            className="btn-play"
            onClick={() => navigate('/game')}
          >
            ▶ Start game
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
