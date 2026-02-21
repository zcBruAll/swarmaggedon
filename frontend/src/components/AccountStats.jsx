function AccountStats() {
    return <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">My stats — ghost_451</span>
                  <span className="tag">Rank #142</span>
                </div>
                <div className="panel-body">
                  <div className="stats-grid">
                    <div className="stat-box" style={{ transform: 'rotate(-0.4deg)' }}>
                      <div className="stat-value">1,204</div>
                      <div className="stat-label">Games played</div>
                    </div>
                    <div className="stat-box" style={{ transform: 'rotate(0.3deg)' }}>
                      <div className="stat-value">68%</div>
                      <div className="stat-label">Win rate</div>
                    </div>
                    <div className="stat-box" style={{ transform: 'rotate(0.5deg)' }}>
                      <div className="stat-value">04:21:08</div>
                      <div className="stat-label">Best run</div>
                    </div>
                    <div className="stat-box" style={{ transform: 'rotate(-0.3deg)' }}>
                      <div className="stat-value">3.2M</div>
                      <div className="stat-label">Enemies killed</div>
                    </div>
                    <div className="stat-box" style={{ transform: 'rotate(0.4deg)' }}>
                      <div className="stat-value">98,430</div>
                      <div className="stat-label">High score</div>
                    </div>
                    <div className="stat-box" style={{ transform: 'rotate(-0.5deg)' }}>
                      <div className="stat-value">47:32</div>
                      <div className="stat-label">Avg survival</div>
                    </div>
                  </div>
                </div>
              </div>
}

export default AccountStats;