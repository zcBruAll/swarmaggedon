import { Link, useLocation } from 'react-router-dom';
import '../assets/style/components/NavBar.css';
import { useAuth } from '../context/AuthContext';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const PENDING_REQUESTS = gql`
  query PR {
    pending_requests {
      id
    }
  }
`

function NavBar() {
  const location = useLocation();
  const { isLoggedIn, user } = useAuth();
  const { loading, error, data } = useQuery(PENDING_REQUESTS)
  
  return (
    <header>
      <div>
        <span className="logo">Swarmaggedon</span>
        <span className="logo-sub">Survivor game - v0.0.0</span>
      </div>
      <nav>
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          Dashboard
        </Link>
        {
          isLoggedIn && 
          <>
            <Link 
              to="/account" 
              className={`nav-link ${location.pathname === '/account' ? 'active' : ''}`}
            >
              Account
            </Link>
            <Link 
              to="/friends" 
              className={`nav-link ${location.pathname === '/friends' ? 'active' : ''}`}
            >
              Friends
              {!loading && !error && data.pending_requests?.length > 0 ? <span className="nav-badge">{data.pending_requests.length}</span>: ""}
            </Link>
          </>
        }
      </nav>
      
      <div className="header-right">
        {isLoggedIn ? (
            <>
              <span className="status-badge online">● connected</span>
              <span className="status-badge">{user?.username || 'User'}</span>
            </>
        ) : (
            <Link 
                to="/auth" 
                className={`nav-link ${location.pathname === '/auth' ? 'active' : ''}`}
            >
                Login / Register
            </Link>
        )}
      </div>
    </header>
  )
}

export default NavBar
