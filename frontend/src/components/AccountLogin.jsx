import React, { useState } from 'react';

function AccountLogin() {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Login attempt:', loginData);
    const data = await fetch('/api/auth/login', {
      method: "POST",
      body: JSON.stringify(loginData),
      headers: {
        "Content-Type": "application/json"
      }
    })
    console.log('result:', data);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    console.log('Register attempt:', registerData);
    const data = await fetch('/api/auth/register', {
      method: "POST",
      body: JSON.stringify(registerData),
      headers: {
        "Content-Type": "application/json"
      }
    })
    console.log('result:', data)
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', alignItems: 'start'}}>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Login</span>
        </div>
        <div className="panel-body">        
          <form id="auth-login" onSubmit={handleLogin}>
            <div className="form-row">
              <div className="label">username</div>
              <input 
                type="text" 
                placeholder="your_username" 
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="label">password</div>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">Login →</button>
            <div className="text-muted text-center mt-8"><em>forgot password?</em></div>
          </form>
        </div>
      </div>
      
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Register</span>
        </div>
        <div className="panel-body">
          <form id="auth-register" onSubmit={handleRegister}>
            <div className="form-row">
              <div className="label">choose a handle</div>
              <input 
                type="text" 
                placeholder="coolname_42" 
                value={registerData.username}
                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="label">email</div>
              <input 
                type="email" 
                placeholder="you@example.com" 
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="label">password</div>
              <input 
                type="password" 
                placeholder="min. 8 chars" 
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="label">confirm password</div>
              <input 
                type="password" 
                placeholder="again..." 
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">Create account →</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AccountLogin;
