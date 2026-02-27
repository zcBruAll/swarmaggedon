import { gql } from '@apollo/client';
import '../assets/style/components/FriendsStats.css';
import { isUserOnline } from '../utils/Utils.js';
import { useQuery } from '@apollo/client/react';

const GET_FRIENDS = gql`
  query User {
    friends {
      id
      username
      last_online
      in_game
      date_created
      stats {
          avg_wave
          high_score
      }
    }
  }
`

function FriendsStats() {
  const { loading, error, data } = useQuery(GET_FRIENDS)
  console.log(data)

  if (loading) return <div>Loading friends...</div>;

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Friends stats</span>
        <span className="tag">{data?.friends.length} friend{data?.friends.length === 1 ? "" : "s"}</span>
      </div>
      <div className="panel-body friend-stats">
        <div className="friend-stat-row-title">
          <span></span>
          <span className="label" style={{ margin: 0 }}>player</span>
          <span className="label" style={{ margin: 0 }}>score</span>
          <span className="label" style={{ margin: 0 }}>avg wave</span>
          <span className="label" style={{ margin: 0 }}>status</span>
        </div>
        <div className="scroll-y">
          {data?.friends.length === 0 ? (
            <div className='friend-stat-row'>
              <span></span>
              <span className="text-muted">No friends yet.</span>
            </div>
          ) : (
            data.friends.map(friend => (
              <div className="friend-stat-row" key={friend.id}>
                <div className="avatar">{friend.username?.substring(0, 2).toUpperCase()}</div>
                <span>{friend.username}</span>
                <span className="score">{friend.stats?.high_score?.toLocaleString() || 0}</span>
                <span className="text-muted">{(friend.stats?.avg_wave || 0).toFixed(1)}</span>
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