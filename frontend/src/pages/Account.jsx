import { useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import '../assets/style/pages/Account.css';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { sha256 } from 'js-sha256';
import { AccountDelete } from '../components/AccountDelete';
import NavBar from '../components/NavBar';
import { PatchNotes } from '../components/PatchNotes';
import { WikiHelp } from '../components/Wiki';
import { useTranslation } from 'react-i18next';

const MUTATION_CHANGEUSERNAME = gql`
  mutation UserChange($newUsername: String!) {
    changeUsername(newUsername: $newUsername)
  }
`;

const MUTATION_CHANGEPASSWORD = gql`
  mutation PasswordChange($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword)
  }
`;

const Account = () => {
  const { t } = useTranslation();
  const { isLoggedIn, user, logout, loading, checkAuth } = useAuth();
  const [usernameChange, setUsernameChange] = useState('');
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [status, setStatus] = useState({ type: '', text: '' });
  const [changeUsername, { loading: newUsernameLoading }] = useMutation(MUTATION_CHANGEUSERNAME);
  const [changePassword, { loading: passwordLoading }] = useMutation(MUTATION_CHANGEPASSWORD);
  const [showDeleteAccountPanel, setShowDeleteAccountPanel] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isLoggedIn) navigate('/auth');
  }, [isLoggedIn, loading, navigate]);

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });

    if (!usernameChange || usernameChange === user.username) {
      setStatus({ type: 'error', text: t('account.errors.differentUsername') });
      return;
    }

    try {
      const { data } = await changeUsername({ variables: { newUsername: usernameChange } });
      if (data.changeUsername === "Username changed successfully") {
        setStatus({ type: 'success', text: data.changeUsername });
        await checkAuth();
      } else {
        setStatus({ type: 'error', text: data.changeUsername || t('account.errors.differentUsername') });
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || t('account.errors.differentUsername') });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setStatus({ type: 'error', text: t('account.errors.fillAllFields') });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setStatus({ type: 'error', text: t('account.errors.passwordMismatch') });
      return;
    }

    try {
      const { data } = await changePassword({
        variables: {
          oldPassword: sha256(passwordData.oldPassword),
          newPassword: sha256(passwordData.newPassword)
        }
      });
      if (data.changePassword === "Password changed successfully") {
        setStatus({ type: 'success', text: data.changePassword });
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setStatus({ type: 'error', text: data.changePassword || t('account.errors.passwordMismatch') });
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || t('account.errors.passwordMismatch') });
    }
  };

  const Message = ({ type, text }) => (
    <div style={{
      backgroundColor: type === 'success' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
      border: `1px solid ${type === 'success' ? 'var(--accent)' : 'var(--red)'}`,
      color: type === 'success' ? 'var(--accent)' : 'var(--red)',
      padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px'
    }}>
      {text}
    </div>
  );

  if (loading || !isLoggedIn) {
    return (
      <>
        <NavBar />
        <PatchNotes />
        <WikiHelp />
        <div id="section-account" className="section-content active">
          <div style={{ textAlign: 'center', padding: '100px' }}>
            <p>{loading ? t('account.loading') : t('account.redirecting')}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <PatchNotes />
      <WikiHelp />
      <div id="section-account" className="section-content active" style={{ position: 'relative' }}>
        <AccountDelete user={user} show={showDeleteAccountPanel} onClose={() => setShowDeleteAccountPanel(false)}>
          <div className="main account-main">
            <div className="panel" style={{ gridColumn: '1/-1' }}>
              <div className="panel-header">
                <span className="panel-title">{t('account.title')}</span>
                <span className="tag tag-accent">{user.username}</span>
              </div>
              <div className="panel-body account-panel-body">
                <div>
                  {status.text && <Message type={status.type} text={status.text} />}
                  <div className="label" style={{ fontSize: '14px', color: 'var(--ink-mid)', marginBottom: '12px' }}>
                    {t('account.profile')}
                  </div>
                  <div className="account-field">
                    <div className="label">{t('account.usernameLabel')}</div>
                    <form id="user-change" onSubmit={handleUsernameChange}>
                      <div className="account-field-row">
                        <input
                          type="text"
                          onChange={(e) => setUsernameChange(e.target.value)}
                          defaultValue={user.username}
                          disabled={newUsernameLoading}
                        />
                        <button className="btn btn-outline btn-sm">{t('account.updateButton')}</button>
                      </div>
                    </form>
                  </div>
                  <div className="account-field">
                    <div className="label">{t('account.emailLabel')}</div>
                    <div className="account-field-row">
                      <input type="email" defaultValue={user.email} readOnly />
                    </div>
                  </div>
                  <hr className="divider" />
                  <div className="label" style={{ fontSize: '14px', color: 'var(--red)' }}>
                    {t('account.dangerZone')}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteAccountPanel(true)}>
                      {t('account.deleteAccount')}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={logout}>
                      {t('account.logout')}
                    </button>
                  </div>
                </div>
                <div>
                  <div className="label" style={{ fontSize: '14px', color: 'var(--ink-mid)', marginBottom: '12px' }}>
                    {t('account.security')}
                  </div>
                  <form id="password-change" onSubmit={handlePasswordChange}>
                    <div className="account-field">
                      <div className="label">{t('account.currentPassword')}</div>
                      <input
                        type="password"
                        placeholder={t('account.passwordPlaceholder')}
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                        disabled={passwordLoading}
                      />
                    </div>
                    <div className="account-field">
                      <div className="label">{t('account.newPassword')}</div>
                      <input
                        type="password"
                        placeholder={t('account.passwordPlaceholder')}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        disabled={passwordLoading}
                      />
                    </div>
                    <div className="account-field">
                      <div className="label">{t('account.confirmNewPassword')}</div>
                      <input
                        type="password"
                        placeholder={t('account.passwordPlaceholder')}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        disabled={passwordLoading}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm mt-8" disabled={passwordLoading}>
                      {passwordLoading ? t('account.changingPassword') : t('account.changePassword')}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </AccountDelete>
      </div>
    </>
  );
};

export default Account;