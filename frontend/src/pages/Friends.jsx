import { useNavigate, Link } from 'react-router-dom';
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
import { useTranslation } from 'react-i18next';

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
    pending_incoming_requests {
      id
      username
    }
    pending_outgoing_requests {
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
  const { t } = useTranslation();
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
            <p>{authLoading ? t('friends.loading') : t('friends.redirecting')}</p>
          </div>
        </div>
      </>
    );
  }

  const friends = friendsData?.friends || [];
  const pending_incoming_requests = friendsData?.pending_incoming_requests || [];
  const pending_outgoing_requests = friendsData?.pending_outgoing_requests || [];
  const searchResults = localSearch;

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchUsername.trim()) return;
    setSearchError("")
    setInitialSearchDone(true)
    try {
      const { data } = await searchFriends({ variables: { usernameSearch: searchUsername } });
      if (data?.search) setLocalSearch(data.search);
    } catch (err) {
      setSearchError(t('friends.errors.searchFailed'));
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
            <div className="panel-header"><span className="panel-title">{t('friends.addTitle')}</span></div>
            <div className="panel-body">
              {searchError && <div style={{ color: 'var(--red)', marginBottom: '12px', fontSize: '14px' }}>{searchError}</div>}
              <form id="search-form" onSubmit={handleSearch}>
                <div className="label">{t('friends.searchLabel')}</div>
                <div className="flex gap-8 mt-8">
                  <input
                    type="text" placeholder={t('friends.searchPlaceholder')}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    disabled={searchLoading}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ whiteSpace: 'nowrap' }}
                    disabled={searchLoading}
                  >
                    {searchLoading ? <LoadingSpinner /> : t('friends.searchButton')}
                  </button>
                </div>
                {
                  initialSearchDone ?
                    searchLoading ?
                      <div style={{ textAlign: 'center', padding: '10px' }}><LoadingSpinner /></div>
                      :
                      <>
                        <hr className="divider" />
                        <div className="label">{t('friends.resultsLabel')}</div>
                        {searchResults.length === 0 ? (
                          <div className="text-muted p-8">{t('friends.noResults')}</div>
                        ) : (
                          searchResults
                            .filter(x => !friends.some(f => f.id === x.id))
                            .map(x => (
                              <Link key={x.id} to={`/profile/${x.username}`} className="list-item-link">
                                <div className="flex-between search-result">
                                  <span>{x.username}</span>
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddFriend(x.id); }}
                                  >
                                    {t('friends.addButton')}
                                  </button>
                                </div>
                              </Link>
                            ))
                        )}
                      </>
                    : ""
                }
                {pending_incoming_requests.length != 0 ?
                  <>
                    <hr className="divider" />
                    <div className="label">{t('friends.pendingLabel')}</div>
                    {
                      pending_incoming_requests.map(f => {
                        return <Link key={f.id} to={`/profile/${f.username}`} className="list-item-link">
                          <div className="flex-between pending-request-row">
                            <div className="friend-info">
                              <div className="avatar">{f.username.slice(0, 2).toUpperCase()}</div>
                              <div className='friend-label'>
                                <div style={{ fontWeight: 700 }}>{f.username}</div>
                                <div style={{ fontSize: '14px' }} className="text-muted">{t('friends.wantsToFriend')}</div>
                              </div>
                            </div>
                            <div className="flex gap-8">
                              <button type="button" className="btn btn-primary btn-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddFriend(f.id, false); }}>{t('friends.accept')}</button>
                              <button type="button" className="btn btn-outline btn-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(f.id, false); }}>{t('friends.decline')}</button>
                            </div>
                          </div>
                        </Link>
                      })
                    }
                  </> : <></>
                }
                {pending_outgoing_requests.length != 0 ?
                  <>
                    <hr className="divider" />
                    <div className="label">{t('friends.pendingSentLabel')}</div>
                    {
                      pending_outgoing_requests.map(f => {
                        return <Link key={f.id} to={`/profile/${f.username}`} className="list-item-link">
                          <div className="flex-between pending-request-row">
                            <div className="friend-info">
                              <div className="avatar">{f.username.slice(0, 2).toUpperCase()}</div>
                              <div className='friend-label'>
                                <div style={{ fontWeight: 700 }}>{f.username}</div>
                              </div>
                            </div>
                            <div className="flex gap-8">
                              <button type="button" className="btn btn-outline btn-sm btn-danger" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(f.id, false); }}>{t('friends.removePendingButton')}</button>
                            </div>
                          </div>
                        </Link>
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
              <span className="panel-title">{t('friends.title')}</span>
              <span className="tag">
                {t(friends.length === 1 ? 'friends.count_one' : 'friends.count_other', { count: friends.length })}
              </span>
            </div>
            <div className="panel-body">
              <div className="scroll-y">
                {loadingFriends ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}><LoadingSpinner /></div>
                ) : friends.length === 0 ? (
                  <div className="p-16 text-muted">{t('friends.noFriends')}</div>
                ) : (
                  [...friends]
                    .sort((a, b) => {
                      const statusA = a.in_game ? 2 : isUserOnline(a.last_online) ? 1 : 0;
                      const statusB = b.in_game ? 2 : isUserOnline(b.last_online) ? 1 : 0;
                      return statusB - statusA;
                    })
                    .map(friend => (
                      <Link key={friend.id} to={`/profile/${friend.username}`} className="list-item-link">
                        <div className="friend-row">
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
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(friend.id); }}
                          >
                            {confirmingId === friend.id ? t('friends.confirmRemove') : t('friends.removeButton')}
                          </button>
                        </div>
                      </Link>
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
