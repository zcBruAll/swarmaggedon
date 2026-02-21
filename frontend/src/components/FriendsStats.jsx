function FriendsStats() {
    return <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Friends stats</span>
                <span className="tag">5 friends</span>
              </div>
              <div className="panel-body">
                <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto auto auto', gap: '8px', alignItems: 'center', paddingBottom: '6px', borderBottom: '1px solid var(--line)' }}>
                  <span></span>
                  <span className="label" style={{ margin: 0 }}>player</span>
                  <span className="label" style={{ margin: 0 }}>score</span>
                  <span className="label" style={{ margin: 0 }}>win%</span>
                  <span className="label" style={{ margin: 0 }}>status</span>
                </div>
                <div className="scroll-y">
                  <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto auto auto', gap: '8px', alignItems: 'center', padding: '7px 0', borderBottom: '1px dashed var(--line)' }}>
                    <div className="avatar">VX</div><span style={{ fontWeight: 700 }}>vortex_99</span>
                    <span style={{ color: 'var(--blue)', fontSize: '13px' }}>112,340</span>
                    <span className="text-muted">72%</span>
                    <span style={{ fontSize: '12px' }}><span className="dot dot-online"></span><span style={{ color: '#27ae60' }}>in game</span></span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto auto auto', gap: '8px', alignItems: 'center', padding: '7px 0', borderBottom: '1px dashed var(--line)' }}>
                    <div className="avatar">NK</div><span style={{ fontWeight: 700 }}>null_kick</span>
                    <span style={{ color: 'var(--blue)', fontSize: '13px' }}>89,120</span>
                    <span className="text-muted">61%</span>
                    <span style={{ fontSize: '12px' }}><span className="dot dot-online"></span><span style={{ color: '#27ae60' }}>online</span></span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto auto auto', gap: '8px', alignItems: 'center', padding: '7px 0', borderBottom: '1px dashed var(--line)' }}>
                    <div className="avatar">R7</div><span style={{ fontWeight: 700 }}>r4g3_q7</span>
                    <span style={{ color: 'var(--blue)', fontSize: '13px' }}>77,890</span>
                    <span className="text-muted">58%</span>
                    <span style={{ fontSize: '12px' }}><span className="dot dot-offline"></span><span className="text-muted">offline</span></span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto auto auto', gap: '8px', alignItems: 'center', padding: '7px 0', borderBottom: '1px dashed var(--line)' }}>
                    <div className="avatar">ZR</div><span style={{ fontWeight: 700 }}>zero_rush</span>
                    <span style={{ color: 'var(--blue)', fontSize: '13px' }}>65,400</span>
                    <span className="text-muted">54%</span>
                    <span style={{ fontSize: '12px' }}><span className="dot dot-offline"></span><span className="text-muted">offline</span></span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto auto auto', gap: '8px', alignItems: 'center', padding: '7px 0' }}>
                    <div className="avatar">PL</div><span style={{ fontWeight: 700 }}>pl4gue</span>
                    <span style={{ color: 'var(--blue)', fontSize: '13px' }}>42,100</span>
                    <span className="text-muted">49%</span>
                    <span style={{ fontSize: '12px' }}><span className="dot dot-online"></span><span style={{ color: '#27ae60' }}>online</span></span>
                  </div>
                </div>
              </div>
            </div>
}

export default FriendsStats;