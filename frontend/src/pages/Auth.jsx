import AccountLogin from '../components/AccountLogin'
import '../assets/style/pages/Auth.css'
import NavBar from '../components/NavBar'
import { PatchNotes } from '../components/PatchNotes'
import { WikiHelp } from '../components/Wiki'

const Auth = () => {
  return (
    <>
      <NavBar />
      <PatchNotes />
      <WikiHelp />
      <div className="section-content active">
        <div className='auth-grid'>
          <AccountLogin />
        </div>
      </div>
    </>
  )
}

export default Auth