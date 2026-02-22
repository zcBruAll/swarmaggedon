import { Link, useLocation } from 'react-router-dom';
import '../assets/style/components/NavBar.css';
import { useAuth } from '../context/AuthContext';

function NavBar() {
  const location = useLocation();
  const { isLoggedIn, user } = useAuth();
  
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
