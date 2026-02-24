import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import GlobalStats from '../components/GlobalStats'
import AccountStats from '../components/AccountStats'
import FriendsStats from '../components/FriendsStats'
import GlobalLeaderboard from '../components/GlobalLeaderboard'
import '../assets/style/pages/Dashboard.css'
import GuestWelcome from '../components/GuestWelcome'
import { useAuth } from '../context/AuthContext'
import { formatDurationToHours, formatRelativeTime } from '../utils/Utils'

const Dashboard = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, loading } = useAuth();
  const [lastRun, setLastRun] = useState(null);

  useEffect(() => {
    const fetchLastRun = async () => {
      try {
        const response = await fetch('/api/user/last_run');
        if (response.ok) {
          setLastRun(await response.json());
        }
      } catch (error) {
        console.error("Failed to fetch last run", error);
      }
    };

    if (isLoggedIn) fetchLastRun();
  }, [isLoggedIn]);

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
                <>
                  Last run: {formatRelativeTime(lastRun?.date)} · 
                  best: {formatDurationToHours(user.stats.best_time)} 
                  {user.rank ? ` · rank #${user.rank}` : ""}
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
