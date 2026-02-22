import { useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import '../assets/style/pages/Account.css'
import { useAuth } from '../context/AuthContext';


const Account = () => {
  const { isLoggedIn, user, logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate('/auth');
    }
  }, [isLoggedIn, loading, navigate]);

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
    <div className="main" style={{ 
      gridTemplateColumns: '1fr 1fr', 
      maxWidth: '900px'
    }}>
      <div className="panel" style={{ gridColumn: '1/-1' }}>
        <div className="panel-header">
          <span className="panel-title">Account details</span>
          <span className="tag tag-accent">{user.username}</span>
        </div>
        <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
          <div>
            <div className="label" style={{ fontSize: '14px', color: 'var(--ink-mid)', marginBottom: '12px' }}>— profile —</div>
            <div className="account-field">
              <div className="label">username</div>
              <div className="account-field-row">
                <input type="text" defaultValue={user.username} />
                <button className="btn btn-outline btn-sm">update</button>
              </div>
            </div>
            <div className="account-field">
              <div className="label">email</div>
              <div className="account-field-row">
                <input type="email" defaultValue={user.email} readOnly />
              </div>
            </div>
            <hr className="divider" />
            <div className="label" style={{ fontSize: '14px', color: 'var(--red)',  }}>— danger zone —</div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
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
