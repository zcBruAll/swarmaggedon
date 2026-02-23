import { useAuth } from '../context/AuthContext';
import { formatNumberFull } from '../utils/Utils';

function GlobalLeaderboard() {
  const {user, isLoggedIn} = useAuth()
  return <div>
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Global leaderboard</span>
        <span className="tag">all time</span>
      </div>
      <div className="panel-body">
        <div className="scroll-y">
          <div className="lb-row"><span className="lb-rank top">#1</span><span className="lb-name">apex_swarm</span><span className="lb-score">2,841,220</span></div>
          <div className="lb-row"><span className="lb-rank top">#2</span><span className="lb-name">kr0nos</span><span className="lb-score">2,103,440</span></div>
          <div className="lb-row"><span className="lb-rank top">#3</span><span className="lb-name">d4rkm4tt3r</span><span className="lb-score">1,984,100</span></div>
          <div className="lb-row"><span className="lb-rank">#4</span><span className="lb-name">vortex_99</span><span className="lb-score">1,763,800</span></div>
          <div className="lb-row"><span className="lb-rank">#5</span><span className="lb-name">nyx_1</span><span className="lb-score">1,521,000</span></div>
          <div className="lb-row"><span className="lb-rank">#6</span><span className="lb-name">sl4yer</span><span className="lb-score">1,388,200</span></div>
          <div className="lb-row"><span className="lb-rank">#7</span><span className="lb-name">wraith_7</span><span className="lb-score">1,210,440</span></div>
          <div className="lb-row"><span className="lb-rank">#8</span><span className="lb-name">null_kick</span><span className="lb-score">1,102,900</span></div>
          <div className="lb-row"><span className="lb-rank">#9</span><span className="lb-name">ph4ntom_x</span><span className="lb-score">989,330</span></div>
          <div className="lb-row"><span className="lb-rank">#10</span><span className="lb-name">c0ld_snap</span><span className="lb-score">870,120</span></div>
          {isLoggedIn && <><hr className="divider" />
          <div className="lb-row highlight">
            <span className="lb-rank">#todo</span>
            <span className="lb-name" style={{ color: 'var(--blue)' }}>{user?.username} ← you</span>
            <span className="lb-score">{formatNumberFull(user?.stats.high_score)}</span>
          </div></>}
        </div>
      </div>
    </div>
  </div>
}
export default GlobalLeaderboard