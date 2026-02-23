import AccountLogin from '../components/AccountLogin'
import '../assets/style/pages/Auth.css'

const Auth = () => {
  return (
    <div className="section-content active">
      <div className="main" style={{ gridTemplateColumns: '1fr', maxWidth: '900px' }}>
        <AccountLogin />
      </div>
    </div>
  )
}

export default Auth