import { useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import '../assets/style/pages/Account.css'
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const MUTATION_CHANGEUSERNAME = gql`
  mutation UserChange($newUsername: String!) {
    changeUsername(newUsername: $newUsername)
  }
`

const Account = () => {
  const { isLoggedIn, user, logout, loading, checkAuth } = useAuth();
  const [usernameChange, setUsernameChange] = useState("")
  const [status, setStatus] = useState({ type: '', text: '' });
  const [changeUsername, { loading: newUsernameLoading }] = useMutation(MUTATION_CHANGEUSERNAME)
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate('/auth');
    }
  }, [isLoggedIn, loading, navigate]);

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    
    if (!usernameChange || usernameChange === user.username) {
        setStatus({ type: 'error', text: 'Please enter a different username.' });
        return;
    }

    try {
        const { data } = await changeUsername({
            variables: {
                newUsername: usernameChange
            }
        });
        
        if (data.changeUsername === "Username changed successfully") {
            setStatus({ type: 'success', text: data.changeUsername });
            await checkAuth();
        } else {
            setStatus({ type: 'error', text: data.changeUsername || 'Failed to change username' });
        }
    } catch (err) {
        setStatus({ type: 'error', text: err.message || 'An error occurred' });
    }
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

  if (loading || !isLoggedIn) {
    return (
      <div id="section-account" className="section-content active">
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <p>{loading ? 'Loading account details...' : 'Redirecting to login...'}</p>
        </div>
      </div>
    );
  }
  return (
    <div id="section-account" className="section-content active" style={{ position: 'relative' }}>
      <div className="main account-main">
        <div className="panel" style={{ gridColumn: '1/-1' }}>
          <div className="panel-header">
            <span className="panel-title">Account details</span>
            <span className="tag tag-accent">{user.username}</span>
          </div>
          <div className="panel-body account-panel-body">
            <div>
              {status.text && <Message type={status.type} text={status.text} />}
              <div className="label" style={{ fontSize: '14px', color: 'var(--ink-mid)', marginBottom: '12px' }}>— profile —</div>
              <div className="account-field">
                <div className="label">username</div>
                <form id="user-change" onSubmit={handleUsernameChange}>
                <div className="account-field-row">
                  <input 
                    type="text"
                    onChange={(e) => setUsernameChange(e.target.value)}
                    defaultValue={user.username}
                    disabled={newUsernameLoading}
                  />
                  <button className="btn btn-outline btn-sm">update</button>
                </div>
                </form>
              </div>
              <div className="account-field">
                <div className="label">email</div>
                <div className="account-field-row">
                  <input type="email" defaultValue={user.email} readOnly />
                </div>
              </div>
              <hr className="divider" />
              <div className="label" style={{ fontSize: '14px', color: 'var(--red)', }}>— danger zone —</div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn btn-danger btn-sm">Delete account</button>
                <button className="btn btn-outline btn-sm" onClick={logout}>Log out</button>
              </div>
            </div>
            <div>
              <div className="label" style={{ fontSize: '14px', color: 'var(--ink-mid)', marginBottom: '12px' }}>— security —</div>
              <div className="account-field">
                <div className="label">current password</div>
                <input type="password" placeholder="••••••••" />
              </div>
              <div className="account-field">
                <div className="label">new password</div>
                <input type="password" placeholder="••••••••" />
              </div>
              <div className="account-field">
                <div className="label">confirm new password</div>
                <input type="password" placeholder="••••••••" />
              </div>
              <button className="btn btn-primary btn-sm mt-8">Change password</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default Account;