import '../assets/style/components/FriendsStats.css';

function FriendsStats() {
    return <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Friends stats</span>
                <span className="tag">5 friends</span>
              </div>
              <div className="panel-body">
                <div className="friend-stat-row-title">
                  <span></span>
                  <span className="label" style={{ margin: 0 }}>player</span>
                  <span className="label" style={{ margin: 0 }}>score</span>
                  <span className="label" style={{ margin: 0 }}>win%</span>
                  <span className="label" style={{ margin: 0 }}>status</span>
                </div>
                <div className="scroll-y">
                  <div className="friend-stat-row">
                    <div className="avatar">VX</div><span>vortex_99</span>
                    <span className="score">112,340</span>
                    <span className="text-muted">72%</span>
                    <span className="game-state"><span className="dot dot-online"></span><span className="state-active">in game</span></span>
                  </div>
                  <div className="friend-stat-row">
                    <div className="avatar">NK</div><span>null_kick</span>
                    <span className="score">89,120</span>
                    <span className="text-muted">61%</span>
                    <span className="game-state"><span className="dot dot-online"></span><span className="state-active">online</span></span>
                  </div>
                  <div className="friend-stat-row">
                    <div className="avatar">R7</div><span>r4g3_q7</span>
                    <span className="score">77,890</span>
                    <span className="text-muted">58%</span>
                    <span className="game-state"><span className="dot dot-offline"></span><span className="text-muted">offline</span></span>
                  </div>
                  <div className="friend-stat-row">
                    <div className="avatar">ZR</div><span>zero_rush</span>
                    <span className="score">65,400</span>
                    <span className="text-muted">54%</span>
                    <span className="game-state"><span className="dot dot-offline"></span><span className="text-muted">offline</span></span>
                  </div>
                  <div className="friend-stat-row">
                    <div className="avatar">PL</div><span>pl4gue</span>
                    <span className="score">42,100</span>
                    <span className="text-muted">49%</span>
                    <span className="game-state"><span className="dot dot-online"></span><span className="state-active">online</span></span>
                  </div>
                </div>
              </div>
            </div>
}

export default FriendsStats;