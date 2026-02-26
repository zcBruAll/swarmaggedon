import { useNavigate } from 'react-router-dom';
import '../assets/style/pages/Friends.css'
import { useEffect, useState } from 'react'
import { useFriends } from '../context/FriendsContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext';
import { isUserOnline } from '../utils/Utils';

const Friends = () => {
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { friends, addFriend, removeFriend, pending_requests } = useFriends();

  const [initialSearchDone, setInitialSearchDone] = useState(false)
  const [search, setSearch] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchUsername, setSearchUsername] = useState("")
  const [searchError, setSearchError] = useState("")
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate('/auth');
    }
  }, [isLoggedIn, authLoading, navigate]);

  if (authLoading || !isLoggedIn) {
    return (
      <div id="section-account" className="section-content active">
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <p>{authLoading ? 'Loading account details...' : 'Redirecting to login...'}</p>
        </div>
      </div>
    );
  }

  const Message = ({ type, text }) => (
    <div style={{
      backgroundColor: type === 'success' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
      border: `1px solid ${type === 'success' ? 'var(--accent)' : 'var(--red)'}`,
      color: type === 'success' ? 'var(--accent)' : 'var(--red)',
      padding: '10px',
      borderRadius: '4px',
      marginBottom: '15px',
      fontSize: '14px'
    }}>
      {text}
    </div>
  );

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchUsername.trim()) return;

    setSearchError("")
    setInitialSearchDone(true)
    setSearchLoading(true)

    try {
      const response = await fetch('/api/user/search/' + searchUsername)

      if (response.ok) {
        const data = await response.json()
        // Filter out existing friends and pending requests
        const filteredResults = data.filter(result =>
          !friends.some(f => f.id === result.id) &&
          !pending_requests.some(p => p.id === result.id)
        );
        setSearch(filteredResults)
      } else {
        const err = await response.text()
        setSearchError(err || 'Search failed, please try again later.')
      }
    } catch (error) {
      setSearchError('Search failed, please try again later.')
      console.error("Search error", error)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleRemove = (friendId) => {
    // display confirmation before deleting
    if (confirmingId === friendId) {
      removeFriend(friendId);
      setConfirmingId(null);
    } else {
      setConfirmingId(friendId);
      setTimeout(() => setConfirmingId(null), 3000);
    }
  };

  return (
    <div id="section-friends" className="section-content active">
      <div className="main" style={{ gridTemplateColumns: '1fr 1fr', maxWidth: '900px', alignItems: 'start' }}>
        {/* Add friend */}
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Add a friend</span></div>
          <div className="panel-body">
            {searchError && <Message type="error" text={searchError} />}
            <form id="search-form" onSubmit={handleSearch}>
              <div className="label">search by username</div>
              <div className="flex gap-8 mt-8">
                <input
                  type="text" placeholder="enter a username..."
                  onChange={(e) => setSearchUsername(e.target.value)}
                  disabled={searchLoading}
                />
                <button
                  className="btn btn-primary btn-sm"
                  style={{ whiteSpace: 'nowrap' }}
                  disabled={searchLoading}
                >
                  {searchLoading ? <LoadingSpinner /> : "Search"}
                </button>
              </div>
              {
                initialSearchDone ?
                  searchLoading ?
                    <></>
                    :
                    <>
                      <hr className="divider" />
                      <div className="label">results</div>
                      {search.length === 0 ? (
                        <div className="text-muted p-8">No survivors found.</div>
                      ) : (
                        search.map(x => (
                          <div key={x.id} className="flex-between search-result">
                            <span>{x.username}</span>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => {
                                addFriend(x.id)
                                setSearch(prev => prev.filter(y => y.id !== x.id))
                              }}
                            >
                              + Add
                            </button>
                          </div>
                        ))
                      )}
                    </>
                  : ""
              }
              {pending_requests.filter(x => x.accepter_id === user.id).length != 0 ?
                <>
                  <hr className="divider" />
                  <div className="label">pending requests</div>
                  {
                    pending_requests.filter(x => x.accepter_id === user.id).map(f => {
                      return <div key={f.id} style={{ padding: '10px 0' }} className="flex-between">
                        <div className="friend-info">
                          <div className="avatar">{f.username.slice(0, 2).toUpperCase()}</div>
                          <div className='friend-label'>
                            <div style={{ fontWeight: 700 }}>{f.username}</div>
                            <div style={{ fontSize: '14px' }} className="text-muted">wants to be friends</div>
                          </div>
                        </div>
                        <div className="flex gap-8">
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => addFriend(f.id)}>Accept</button>
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => removeFriend(f.id)}>Decline</button>
                        </div>
                      </div>
                    })
                  }
                </> : <></>
              }
            </form>
          </div>
        </div>

        {/* Friend list */}
        <div className="panel friend-list">
          <div className="panel-header">
            <span className="panel-title">Friend list</span>
            <span className="tag">{friends.length} friend{friends.length === 1 ? "" : "s"}</span>
          </div>
          <div className="panel-body">
            <div className="scroll-y">
              {friends.length === 0 ? (
                <div className="p-16 text-muted">You haven't added any friends yet.</div>
              ) : (
                friends.map(friend => (
                  <div className="friend-row" key={friend.id}>
                    <div className="friend-info">
                      <div className="avatar">{friend.username?.substring(0, 2).toUpperCase()}</div>
                      <div className='friend-label'>
                        <div style={{ fontWeight: 700 }}>{friend.username}</div>
                        <div className='inline-status'>
                          <div className={`dot ${friend.in_game ? 'in-game' : isUserOnline(friend.last_online) ? 'dot-online' : 'dot-offline'}`}></div>
                          <div style={{ fontSize: '14px', color: isUserOnline(friend.last_online) || friend.in_game ? '#27ae60' : 'var(--ink-faint)' }}>
                            {friend.in_game ? 'in game' : isUserOnline(friend.last_online) ? 'online' : 'offline'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      className={`btn btn-sm btn-danger`}
                      onClick={() => handleRemove(friend.id)}
                    >
                      {confirmingId === friend.id ? 'Again...' : 'Remove'}
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
