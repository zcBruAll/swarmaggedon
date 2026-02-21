import AccountLogin from '../components/AccountLogin'

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
