import './Friends.css'

const Friends = () => (
  <div id="section-friends" className="section-content active">
    <div className="main" style={{ gridTemplateColumns: '1fr 1fr', maxWidth: '900px', alignItems: 'start' }}>
      {/* Add friend */}
      <div className="panel">
        <div className="panel-header"><span className="panel-title">Add a friend</span></div>
        <div className="panel-body">
          <div className="label">search by username</div>
          <div className="flex gap-8 mt-8">
            <input type="text" placeholder="enter a username..." />
            <button className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>Search</button>
          </div>
          <hr className="divider" />
          <div className="label">results</div>
          <div style={{ padding: '10px 0', borderBottom: '1px dashed var(--line)' }} className="flex-between">
            <div className="friend-info">
              <div className="avatar">AX</div>
              <div>
                <div style={{ fontWeight: 700 }}>ax_wr4ith</div>
                <div className="text-muted">Rank #88</div>
              </div>
            </div>
            <button className="btn btn-outline btn-sm">+ Add</button>
          </div>
          <div style={{ padding: '10px 0' }} className="flex-between">
            <div className="friend-info">
              <div className="avatar">AX</div>
              <div>
                <div style={{ fontWeight: 700 }}>ax_hunter</div>
                <div className="text-muted">Rank #204</div>
              </div>
            </div>
            <button className="btn btn-outline btn-sm">+ Add</button>
          </div>
          <hr className="divider" />
          <div className="label">pending requests</div>
          <div style={{ padding: '10px 0' }} className="flex-between">
            <div className="friend-info">
              <div className="avatar">ZZ</div>
              <div>
                <div style={{ fontWeight: 700 }}>zer0_z0ne</div>
                <div className="text-muted">wants to be friends</div>
              </div>
            </div>
            <div className="flex gap-8">
              <button className="btn btn-primary btn-sm">Accept</button>
              <button className="btn btn-outline btn-sm">Decline</button>
            </div>
          </div>
        </div>
      </div>

      {/* Friend list */}
      <div className="panel friend-list">
        <div className="panel-header">
          <span className="panel-title">Friend list</span>
          <span className="tag">5 friends</span>
        </div>
        <div className="panel-body">
          <div className="scroll-y">
            <div className="friend-row">
              <div className="friend-info">
                <div className="avatar">VX</div>
                <div>
                  <div style={{ fontWeight: 700 }}>vortex_99</div>
                  <div><span className="dot dot-online"></span><span style={{ fontSize: '12px', color: '#27ae60' }}>In game</span></div>
                </div>
              </div>
              <button className="btn btn-danger btn-sm">Remove</button>
            </div>
            <div className="friend-row">
              <div className="friend-info">
                <div className="avatar">NK</div>
                <div>
                  <div style={{ fontWeight: 700 }}>null_kick</div>
                  <div><span className="dot dot-online"></span><span style={{ fontSize: '12px', color: '#27ae60' }}>Online</span></div>
                </div>
              </div>
              <button className="btn btn-danger btn-sm">Remove</button>
            </div>
            <div className="friend-row">
              <div className="friend-info">
                <div className="avatar">R7</div>
                <div>
                  <div style={{ fontWeight: 700 }}>r4g3_q7</div>
                  <div><span className="dot dot-offline"></span><span style={{ fontSize: '12px', color: 'var(--ink-faint)' }}>Offline</span></div>
                </div>
              </div>
              <button className="btn btn-danger btn-sm">Remove</button>
            </div>
            <div className="friend-row">
              <div className="friend-info">
                <div className="avatar">ZR</div>
                <div>
                  <div style={{ fontWeight: 700 }}>zero_rush</div>
                  <div><span className="dot dot-offline"></span><span style={{ fontSize: '12px', color: 'var(--ink-faint)' }}>Offline — 2d ago</span></div>
                </div>
              </div>
              <button className="btn btn-danger btn-sm">Remove</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Friends;
