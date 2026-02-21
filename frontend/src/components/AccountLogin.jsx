function AccountLogin() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Login</span>
        </div>
        <div className="panel-body">        
          <div id="auth-login">
            <div className="form-row">
              <div className="label">username</div>
              <input type="text" placeholder="your_username" />
            </div>
            <div className="form-row">
              <div className="label">password</div>
              <input type="password" placeholder="••••••••" />
            </div>
            <button className="btn btn-primary btn-block">Login →</button>
            <div className="text-muted text-center mt-8"><em>forgot password?</em></div>
          </div>
        </div>
      </div>
      
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Register</span>
        </div>
        <div className="panel-body">
          <div id="auth-register">
            <div className="form-row">
              <div className="label">choose a handle</div>
              <input type="text" placeholder="coolname_42" />
            </div>
            <div className="form-row">
              <div className="label">email</div>
              <input type="email" placeholder="you@example.com" />
            </div>
            <div className="form-row">
              <div className="label">password</div>
              <input type="password" placeholder="min. 8 chars" />
            </div>
            <div className="form-row">
              <div className="label">confirm password</div>
              <input type="password" placeholder="again..." />
            </div>
            <button className="btn btn-primary btn-block">Create account →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountLogin;
