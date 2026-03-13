import { useNavigate } from 'react-router-dom'
import GlobalStats from '../components/GlobalStats'
import AccountStats from '../components/AccountStats'
import FriendsStats from '../components/FriendsStats'
import GlobalLeaderboard from '../components/GlobalLeaderboard'
import '../assets/style/pages/Dashboard.css'
import GuestWelcome from '../components/GuestWelcome'
import { useAuth } from '../context/AuthContext'
import { formatRelativeTime, formatToRealTime, formatNumberShort } from '../utils/Utils'
import NavBar from '../components/NavBar'
import { PatchNotes } from '../components/PatchNotes'
import { WikiHelp } from '../components/Wiki'
import { useTranslation, Trans } from 'react-i18next'

const Dashboard = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const { t } = useTranslation();

  return (
    <>
      <NavBar />
      <WikiHelp />
      <PatchNotes />
      <div id="section-dashboard" className="section-content active">
        <div className="main" style={{ alignItems: 'stretch' }}>
          <GlobalStats />

          <div style={{ gridRow: 'span 2' }}>
            <GlobalLeaderboard />
          </div>

          {isLoggedIn ? (
            <>
              <AccountStats />
              <FriendsStats />
            </>
          ) : (
            <GuestWelcome />
          )}

          <div className="play-section">
            <div>
              <div className="play-title">{t('dashboard.playTitle')}</div>
              <div className="play-sub">
                {isLoggedIn ? (
                  !user.last_run?.date
                    ? t('dashboard.neverPlayed')
                    : (
                      <Trans
                        i18nKey="dashboard.lastRun"
                        values={{
                          time: formatRelativeTime(user.last_run?.date),
                          wave: user.last_run.wave,
                          duration: formatToRealTime(user.last_run.duration),
                          score: formatNumberShort(user.last_run.score),
                        }}
                        components={[
                          <strong key="0" />,
                          <strong key="1" />,
                          <strong key="2" />,
                          <strong key="3" />,
                        ]}
                      />
                    )
                ) : t('dashboard.createAccount')}
              </div>
            </div>
            <button className="btn-play" onClick={() => navigate('/game')}>
              {t('dashboard.startGame')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;