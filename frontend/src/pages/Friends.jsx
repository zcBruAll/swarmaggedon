import { useNavigate } from 'react-router-dom';
import '../assets/style/pages/Friends.css'
import { useEffect, useState } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext';
import { isUserOnline } from '../utils/Utils';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import NavBar from '../components/NavBar';
import { PatchNotes } from '../components/PatchNotes';
import { WikiHelp } from '../components/Wiki'

const GET_FRIENDS = gql`
  query GetFriends {
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
    pending_requests {
      id
      username
    }
  }
`

const SEARCH_FRIEND = gql`
  query SearchFriend($usernameSearch: String!) {
    search(usernameSearch: $usernameSearch) {
      id
      username
    }
  }
`

const ADD_FRIEND = gql`
  mutation FriendAdd($userId: ID!) {
    addFriend(userId: $userId)
  }
`

const REMOVE_FRIEND = gql`
  mutation FriendDelete($userId: ID!) {
    deleteFriend(userId: $userId)
  }
`

const Friends = () => {
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const { loading: loadingFriends, error: friendsError, data: friendsData, refetch: refetchFriends } = useQuery(GET_FRIENDS)
  const [searchFriends, { loading: searchLoading, data: searchData }] = useLazyQuery(SEARCH_FRIEND)
  const [addFriendMutation] = useMutation(ADD_FRIEND)
  const [removeFriendMutation] = useMutation(REMOVE_FRIEND)

  const navigate = useNavigate();

  const [initialSearchDone, setInitialSearchDone] = useState(false)
  const [searchUsername, setSearchUsername] = useState("")
  const [searchError, setSearchError] = useState("")
  const [confirmingId, setConfirmingId] = useState(null);
  const [localSearch, setLocalSearch] = useState([]);

  useEffect(() => {
    if (searchData?.search) {
      setLocalSearch(searchData.search);
    }
  }, [searchData]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate('/auth');
    }
  }, [isLoggedIn, authLoading, navigate]);

  if (authLoading || !isLoggedIn) {
    return (
      <>
        <NavBar />
        <PatchNotes />
        <WikiHelp />
        <div id="section-account" className="section-content active">
          <div style={{ textAlign: 'center', padding: '100px' }}>
            <p>{authLoading ? 'Loading account details...' : 'Redirecting to login...'}</p>
          </div>
        </div>
      </>
    );
  }

  const friends = friendsData?.friends || [];
  const pending_requests = friendsData?.pending_requests || [];
  const searchResults = localSearch;

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
    try {
      const { data } = await searchFriends({ variables: { usernameSearch: searchUsername } });
      if (data?.search) setLocalSearch(data.search);
    } catch (err) {
      setSearchError("Search failed. Please try again.");
    }
  }

  const handleAddFriend = async (userId, fromSearch = true) => {
    try {
      await addFriendMutation({ variables: { userId } });
      setLocalSearch(prev => prev.filter(u => u.id !== userId));
      if (!fromSearch) await refetchFriends();
    } catch (err) {
      console.error("Add friend error", err);
    }
  }

  const handleRemove = async (friendId, confirm = true) => {
    if (!confirm || confirmingId === friendId) {
      try {
        await removeFriendMutation({ variables: { userId: friendId } });
        await refetchFriends();
        setConfirmingId(null);
      } catch (err) {
        console.error("Remove friend error", err);
      }
    } else {
      setConfirmingId(friendId);
      setTimeout(() => setConfirmingId(null), 3000);
    }
  };

  return (
    <>
      <NavBar />
      <PatchNotes />
      <WikiHelp />
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
                      <div style={{ textAlign: 'center', padding: '10px' }}><LoadingSpinner /></div>
                      :
                      <>
                        <hr className="divider" />
                        <div className="label">results</div>
                        {searchResults.length === 0 ? (
                          <div className="text-muted p-8">No survivors found.</div>
                        ) : (
                          searchResults
                            .filter(x => !friends.some(f => f.id === x.id))
                            .map(x => (
                              <div key={x.id} className="flex-between search-result">
                                <span>{x.username}</span>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => handleAddFriend(x.id)}
                                >
                                  + Add
                                </button>
                              </div>
                            ))
                        )}
                      </>
                    : ""
                }
                {pending_requests.length != 0 ?
                  <>
                    <hr className="divider" />
                    <div className="label">pending requests</div>
                    {
                      pending_requests.map(f => {
                        return <div key={f.id} style={{ padding: '10px 0' }} className="flex-between">
                          <div className="friend-info">
                            <div className="avatar">{f.username.slice(0, 2).toUpperCase()}</div>
                            <div className='friend-label'>
                              <div style={{ fontWeight: 700 }}>{f.username}</div>
                              <div style={{ fontSize: '14px' }} className="text-muted">wants to be friends</div>
                            </div>
                          </div>
                          <div className="flex gap-8">
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => handleAddFriend(f.id, false)}>Accept</button>
                            <button type="button" className="btn btn-outline btn-sm" onClick={() => handleRemove(f.id, false)}>Decline</button>
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
                {loadingFriends ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}><LoadingSpinner /></div>
                ) : friends.length === 0 ? (
                  <div className="p-16 text-muted">You haven't added any friends yet.</div>
                ) : (
                  [...friends]
                    .sort((a, b) => {
                      const statusA = a.in_game ? 2 : isUserOnline(a.last_online) ? 1 : 0;
                      const statusB = b.in_game ? 2 : isUserOnline(b.last_online) ? 1 : 0;
                      return statusB - statusA;
                    })
                    .map(friend => (
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
    </>
  );
};

export default Friends;
