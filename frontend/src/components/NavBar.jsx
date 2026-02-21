import { Link, useLocation } from 'react-router-dom';
import './NavBar.css';

// Placeholder for auth
const isLoggedIn = () => false;

function NavBar() {
  const location = useLocation();
  
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
      </nav>
      
      <div className="header-right">
        {isLoggedIn() ? (
            <>
            <span className="status-badge online">● connected</span>
            <span className="status-badge">ghost_451</span>
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
