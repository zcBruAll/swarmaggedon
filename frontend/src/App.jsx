import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './assets/style/index.css'
import './assets/style/Common.css'
import Game from './pages/Game'
import NavBar from './components/NavBar'
import Dashboard from './pages/Dashboard'
import Account from './pages/Account'
import Friends from './pages/Friends'
import Auth from './pages/Auth'
import { AuthProvider } from './context/AuthContext'
import { PatchNotes } from './components/PatchNotes'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <NavBar />
          
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/account" element={<Account />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/game" element={<Game />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>

          <PatchNotes />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
