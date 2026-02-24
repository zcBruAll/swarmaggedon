import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import GlobalStats from '../components/GlobalStats'
import AccountStats from '../components/AccountStats'
import FriendsStats from '../components/FriendsStats'
import GlobalLeaderboard from '../components/GlobalLeaderboard'
import '../assets/style/pages/Dashboard.css'
import GuestWelcome from '../components/GuestWelcome'
import { useAuth } from '../context/AuthContext'
import { formatDurationToHours } from '../utils/Utils'

const Dashboard = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, loading } = useAuth();
  const [globalRank, setGlobalRank] = useState(-1)

  useEffect(() => {
    const fetchUserRank = async () => {
      try {
        const response = await fetch('/api/global/rank')
        if (response.ok) {
          setGlobalRank((await response.json()).rank)
        }
      } catch(error) {
        console.error("Failed to fetch user rank", error)
      }
    }

    if (isLoggedIn) fetchUserRank()
  })

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
            <div className="play-sub">{isLoggedIn ? `Last run: todo · best: ${formatDurationToHours(user.stats.best_time)} ${!globalRank ? "" : `· rank #${globalRank}`}` : "Create an account to see your stats !"}</div>
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
