import { useNavigate } from 'react-router-dom'
import GlobalStats from '../components/GlobalStats'
import AccountStats from '../components/AccountStats'
import FriendsStats from '../components/FriendsStats'
import GlobalLeaderboard from '../components/GlobalLeaderboard'
import '../assets/style/pages/Dashboard.css'
import GuestWelcome from '../components/GuestWelcome'
import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
  const navigate = useNavigate();
  const { isLoggedIn, loading } = useAuth();

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
            <div className="play-sub">Last run: 28 min ago · best: 04:21:08 · rank #142</div>
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
