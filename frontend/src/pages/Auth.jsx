import AccountLogin from '../components/AccountLogin'
import '../assets/style/pages/Auth.css'
import NavBar from '../components/NavBar'
import { PatchNotes } from '../components/PatchNotes'

const Auth = () => {
  return (
    <>
      <NavBar />
      <PatchNotes />
      <div className="section-content active">
        <div className="main" style={{ gridTemplateColumns: '1fr', maxWidth: '900px' }}>
          <AccountLogin />
        </div>
      </div>
    </>
  )
}

export default Auth