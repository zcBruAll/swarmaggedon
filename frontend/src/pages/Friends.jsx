import '../assets/style/pages/Friends.css'
import { useFriends } from '../context/FriendsContext'

const Friends = () => {
  const { friends, addFriend, removeFriend, pending_requests, loading } = useFriends();

  return (
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
            <div className="text-muted" style={{ padding: '10px 0' }}>Search to find new survivors.</div>
            { loading ? (
                <div className="p-16 text-muted">Loading...</div>
              ) : pending_requests.length != 0 ?
              <>
                <hr className="divider" />
                <div className="label">pending requests</div>
                {
                  pending_requests.map(f => {
                    return <div style={{ padding: '10px 0' }} className="flex-between">
                      <div className="friend-info">
                        <div className="avatar">{f.username.slice(0,2)}</div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{f.username}</div>
                          <div className="text-muted">wants to be friends</div>
                        </div>
                      </div>
                      <div className="flex gap-8">
                        <button className="btn btn-primary btn-sm" onClick={addFriend(f.id)}>Accept</button>
                        <button className="btn btn-outline btn-sm" onClick={removeFriend(f.id)}>Decline</button>
                      </div>
                    </div>
                  })
                }
              </> : <></>
            }
          </div>
        </div>

        {/* Friend list */}
        <div className="panel friend-list">
          <div className="panel-header">
            <span className="panel-title">Friend list</span>
            <span className="tag">{friends.length} friends</span>
          </div>
          <div className="panel-body">
            <div className="scroll-y">
              {loading ? (
                <div className="p-16 text-muted">Loading friends...</div>
              ) : friends.length === 0 ? (
                <div className="p-16 text-muted">You haven't added any friends yet.</div>
              ) : (
                friends.map(friend => (
                  <div className="friend-row" key={friend.id}>
                    <div className="friend-info">
                      <div className="avatar">{friend.username?.substring(0, 2).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{friend.username}</div>
                        <div>
                          <span className={`dot ${friend.status === 'online' || friend.status === 'in-game' ? 'dot-online' : 'dot-offline'}`}></span>
                          <span style={{ fontSize: '12px', color: friend.status === 'online' || friend.status === 'in-game' ? '#27ae60' : 'var(--ink-faint)' }}>
                            {friend.status === 'in-game' ? 'In game' : friend.status || 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => removeFriend(friend.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Friends;
