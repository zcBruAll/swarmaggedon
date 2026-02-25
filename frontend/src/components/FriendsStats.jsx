import '../assets/style/components/FriendsStats.css';
import { useFriends } from '../context/FriendsContext';
import { isUserOnline } from '../utils/Utils.js';

function FriendsStats() {
  const { friends, loading } = useFriends();

  if (loading) return <div>Loading friends...</div>;

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Friends stats</span>
        <span className="tag">{friends.length} friend{friends.length === 1 ? "": "s"}</span>
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
          {friends.length === 0 ? (
            <div className="text-muted p-16">No friends yet.</div>
          ) : (
            friends.map(friend => (
              <div className="friend-stat-row" key={friend.id}>
                <div className="avatar">{friend.username?.substring(0, 2).toUpperCase()}</div>
                <span>{friend.username}</span>
                <span className="score">{friend.stats?.score?.toLocaleString() || 0}</span>
                <span className="text-muted">{(friend.stats.win_rate * 100).toFixed(1)}%</span>
                <span className="game-state">
                  <span className={`dot ${isUserOnline(friend.last_online) || friend.in_game ? 'dot-online' : 'dot-offline'}`}></span>
                  <span className={isUserOnline(friend.last_online) || friend.in_game ? 'state-active' : 'text-muted'}>
                    {friend.in_game ? 'in game' : isUserOnline(friend.last_online) ? "online" : 'offline'}
                  </span>
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default FriendsStats;