import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

function AccountLogin() {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [isLoadingRegister, setIsLoadingRegister] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  
  const { checkAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoadingLogin(true);
    setLoginError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: "POST",
        body: JSON.stringify(loginData),
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (response.ok) {
        await checkAuth();
        navigate('/account');
      } else {
        const err = await response.text();
        setLoginError(err || 'Failed to login');
      }
    } catch (error) {
      setLoginError('An unexpected error occurred');
      console.error('Login error:', error);
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegistrationSuccess(false);

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Passwords do not match");
      return;
    }
    
    setIsLoadingRegister(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: "POST",
        body: JSON.stringify(registerData),
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (response.ok) {
        setRegistrationSuccess(true);
        setRegisterData({ username: '', email: '', password: '', confirmPassword: '' });
      } else {
        const err = await response.text();
        setRegisterError(err || 'Failed to create account');
      }
    } catch (error) {
      setRegisterError('An unexpected error occurred');
      console.error('Register error:', error);
    } finally {
      setIsLoadingRegister(false);
    }
  };

  const Message = ({ type, text }) => (
    <div style={{ 
      backgroundColor: type === 'success' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)', 
      border: `1px solid ${type === 'success' ? 'var(--accent)' : 'var(--red)'}`, 
      color: type === 'success' ? 'var(--accent)' : 'var(--red)', 
      padding: '10px', 
      borderRadius: '4px', 
      marginBottom: '15px',
      fontSize: '14px'
    }}>
      {text}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', alignItems: 'start'}}>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Login</span>
        </div>
        <div className="panel-body">        
          {loginError && <Message type="error" text={loginError} />}
          <form id="auth-login" onSubmit={handleLogin}>
            <div className="form-row">
              <div className="label">username</div>
              <input 
                type="text" 
                placeholder="your_username" 
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                disabled={isLoadingLogin}
                />
            </div>
            <div className="form-row">
              <div className="label">password</div>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                disabled={isLoadingLogin}
                />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={isLoadingLogin}>
              {isLoadingLogin ? <LoadingSpinner /> : null}
              {isLoadingLogin ? 'Connecting...' : 'Login →'}
            </button>
            <div className="text-muted text-center mt-8"><em>forgot password?</em></div>
          </form>
        </div>
      </div>
      
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Register</span>
        </div>
        <div className="panel-body">
          {registrationSuccess && <Message type="success" text="Account created! Please login." />}
          <form id="auth-register" onSubmit={handleRegister}>
            <div className="form-row">
              <div className="label">choose a handle</div>
              <input 
                type="text" 
                placeholder="coolname_42" 
                value={registerData.username}
                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                disabled={isLoadingRegister}
              />
            </div>
            <div className="form-row">
              <div className="label">email</div>
              <input 
                type="email" 
                placeholder="you@example.com" 
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                disabled={isLoadingRegister}
              />
            </div>
            <div className="form-row">
              <div className="label">password</div>
              <input 
                type="password" 
                placeholder="min. 8 chars" 
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                disabled={isLoadingRegister}
              />
            </div>
            <div className="form-row">
              <div className="label">confirm password</div>
              <input 
                type="password" 
                placeholder="again..." 
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                disabled={isLoadingRegister}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={isLoadingRegister}>
              {isLoadingRegister ? <LoadingSpinner /> : null}
              {isLoadingRegister ? 'Creating...' : 'Create account →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AccountLogin;
