import { useNavigate } from 'react-router-dom'
import GlobalStats from '../components/GlobalStats'
import AccountStats from '../components/AccountStats'
import FriendsStats from '../components/FriendsStats'
import GlobalLeaderboard from '../components/GlobalLeaderboard'
import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <div id="section-dashboard" className="section-content active">
      <div className="main">
        {/* Global stats bar */}
        <GlobalStats />

        {/* LEFT: account stats */}
        { true ? <AccountStats /> : "Login to see your stats and friends' activity !"}

        {/* CENTER: Friends stats */}
        <FriendsStats />

        {/* RIGHT: Leaderboard */}
        <GlobalLeaderboard />

        {/* PLAY BUTTON */}
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
