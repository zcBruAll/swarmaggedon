import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import '../assets/style/components/NavBar.css';
import { useAuth } from '../context/AuthContext';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n/index.js';

const PENDING_REQUESTS = gql`
  query PR {
    pending_incoming_requests {
      id
    }
  }
`

function LanguagePicker() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find(l => i18n.language.startsWith(l.code)) ?? LANGUAGES[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: open ? 'var(--paper3)' : 'none',
          border: '1px solid var(--line)',
          fontFamily: "'Patrick Hand', cursive",
          fontSize: '18px',
          color: 'var(--ink-mid)',
          cursor: 'pointer',
          padding: '3px 10px',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          userSelect: 'none',
        }}
        title="Select language"
      >
        {current.flag} {current.code.toUpperCase()} <span style={{ fontSize: '12px', opacity: 0.6 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          right: 0,
          background: 'var(--paper)',
          border: '2px solid var(--ink)',
          boxShadow: '3px 3px 0 var(--ink)',
          zIndex: 200,
          minWidth: '140px',
          borderRadius: '2px',
        }}>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '7px 14px',
                background: i18n.language.startsWith(lang.code) ? 'var(--paper3)' : 'none',
                border: 'none',
                borderBottom: '1px solid var(--line)',
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '18px',
                color: 'var(--ink)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {lang.flag} {lang.label}
              {i18n.language.startsWith(lang.code) && (
                <span style={{ marginLeft: 'auto', color: 'var(--blue)', fontSize: '14px' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NavBar() {
  const location = useLocation();
  const { isLoggedIn, user } = useAuth();
  const { loading, error, data } = useQuery(PENDING_REQUESTS);
  const { t } = useTranslation();

  return (
    <header>
      <div>
        <span className="logo">
          {process.env.NODE_ENV !== 'production' ? t('appNameDev') : t('appName')}
        </span>
      </div>
      <nav>
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          {t('nav.dashboard')}
        </Link>
        {isLoggedIn && (
          <>
            <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
              {t('nav.profile')}
            </Link>
            <Link to="/friends" className={`nav-link ${location.pathname === '/friends' ? 'active' : ''}`}>
              {t('nav.friends')}
              {!loading && !error && data.pending_incoming_requests?.length > 0
                ? <span className="nav-badge">{data.pending_incoming_requests.length}</span>
                : ''}
            </Link>
          </>
        )}
      </nav>

      <div className="header-right">
        <LanguagePicker />

        {isLoggedIn ? (
          <>
            <span className="status-badge online">{t('nav.connected')}</span>
            <span className="status-badge">{user?.username || 'User'}</span>
          </>
        ) : (
          <Link to="/auth" className={`nav-link ${location.pathname === '/auth' ? 'active' : ''}`}>
            {t('nav.loginRegister')}
          </Link>
        )}
      </div>
    </header>
  );
}

export default NavBar;