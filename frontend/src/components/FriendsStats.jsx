import { gql } from '@apollo/client';
import '../assets/style/components/FriendsStats.css';
import { formatDurationToHours, formatNumberFull, formatTotalToHours, isUserOnline } from '../utils/Utils.js';
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
          total_time
          high_score
      }
    }
  }
`

function FriendsStats() {
  const { loading, error, data } = useQuery(GET_FRIENDS);

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
          <span className="label" style={{ margin: 0 }}>total time</span>
          <span className="label" style={{ margin: 0 }}>status</span>
        </div>
        <div className="scroll-y">
          {data?.friends.length === 0 ? (
            <div className='friend-stat-row'>
              <span></span>
              <span className="text-muted">No friends yet.</span>
            </div>
          ) : (
            [...data.friends]
              .sort((a, b) => {
                const statusA = a.in_game ? 2 : isUserOnline(a.last_online) ? 1 : 0;
                const statusB = b.in_game ? 2 : isUserOnline(b.last_online) ? 1 : 0;
                if (statusB !== statusA) {
                  return statusB - statusA;
                }
                const scoreA = a.stats?.high_score || 0;
                const scoreB = b.stats?.high_score || 0;
                return scoreB - scoreA;
              })
              .map(friend => (
              <div className="friend-stat-row" key={friend.id}>
                <div className="avatar">{friend.username?.substring(0, 2).toUpperCase()}</div>
                <span>{friend.username}</span>
                <span className="score">{friend.stats?.high_score?.toLocaleString() || 0}</span>
                <span className="text-muted">{formatTotalToHours(friend.stats?.total_time).toFixed(friend.stats?.total_time / 3600 > 10 ? 0 : 1)}h</span>
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