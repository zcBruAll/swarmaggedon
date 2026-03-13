import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { sha256 } from 'js-sha256';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import '../assets/style/components/AccountLogin.css';

const MUTATION_LOGIN = gql`
  mutation LoginUser($username: String!, $password: String!) {
    login(username: $username, password: $password)
  }
`;

const MUTATION_REGISTER = gql`
  mutation RegisterUser($username: String!, $email: String!, $password: String!) {
    register(username: $username, email: $email, password: $password)
  }
`;

function AccountLogin() {
  const { t } = useTranslation();
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loginUser, { loading: isLoadingLogin }] = useMutation(MUTATION_LOGIN);
  const [registerUser, { loading: isLoadingRegister }] = useMutation(MUTATION_REGISTER);

  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');

  const { checkAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const { data } = await loginUser({
        variables: {
          username: loginData.username,
          password: sha256(loginData.password)
        }
      });
      if (data.login === "Logged in successfully") {
        await checkAuth();
        navigate('/account');
      } else {
        setLoginError(data.login || t('auth.errors.unexpected'));
      }
    } catch (error) {
      setLoginError(t('auth.errors.unexpected'));
      console.error('Login error:', error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegistrationSuccess(false);

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError(t('auth.errors.passwordMismatch'));
      return;
    }

    try {
      const { data } = await registerUser({
        variables: {
          username: registerData.username,
          email: registerData.email,
          password: sha256(registerData.password)
        }
      });
      if (data.register === "Account created successfully") {
        setRegistrationSuccess(true);
        setRegisterData({ username: '', email: '', password: '', confirmPassword: '' });
      } else {
        setRegisterError(data.register || t('auth.errors.unexpected'));
      }
    } catch (error) {
      setRegisterError(t('auth.errors.unexpected'));
      console.error('Register error:', error);
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
    <div className='authentication-panels'>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('auth.login.title')}</span>
        </div>
        <div className="panel-body">
          {loginError && <Message type="error" text={loginError} />}
          <form id="auth-login" onSubmit={handleLogin}>
            <div className="form-row">
              <div className="label">{t('auth.login.usernameLabel')}</div>
              <input
                type="text"
                placeholder={t('auth.login.usernamePlaceholder')}
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                disabled={isLoadingLogin}
              />
            </div>
            <div className="form-row">
              <div className="label">{t('auth.login.passwordLabel')}</div>
              <input
                type="password"
                placeholder={t('auth.login.passwordPlaceholder')}
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                disabled={isLoadingLogin}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={isLoadingLogin}>
              {isLoadingLogin ? <LoadingSpinner /> : null}
              {isLoadingLogin ? t('auth.login.submitting') : t('auth.login.submit')}
            </button>
            <div className="text-muted text-center mt-8">
              <em>{t('auth.login.forgotPassword')}</em>
            </div>
          </form>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('auth.register.title')}</span>
        </div>
        <div className="panel-body">
          {registerError && <Message type="error" text={registerError} />}
          {registrationSuccess && <Message type="success" text={t('auth.register.successMessage')} />}
          <form id="auth-register" onSubmit={handleRegister}>
            <div className="form-row">
              <div className="label">{t('auth.register.handleLabel')}</div>
              <input
                type="text"
                placeholder={t('auth.register.handlePlaceholder')}
                value={registerData.username}
                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                disabled={isLoadingRegister}
              />
            </div>
            <div className="form-row">
              <div className="label">{t('auth.register.emailLabel')}</div>
              <input
                type="email"
                placeholder={t('auth.register.emailPlaceholder')}
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                disabled={isLoadingRegister}
              />
            </div>
            <div className="form-row">
              <div className="label">{t('auth.register.passwordLabel')}</div>
              <input
                type="password"
                placeholder={t('auth.register.passwordPlaceholder')}
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                disabled={isLoadingRegister}
              />
            </div>
            <div className="form-row">
              <div className="label">{t('auth.register.confirmLabel')}</div>
              <input
                type="password"
                placeholder={t('auth.register.confirmPlaceholder')}
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                disabled={isLoadingRegister}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={isLoadingRegister}>
              {isLoadingRegister ? <LoadingSpinner /> : null}
              {isLoadingRegister ? t('auth.register.submitting') : t('auth.register.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AccountLogin;