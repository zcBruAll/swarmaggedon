import React, { createContext, useState, useContext } from 'react';
import { gql } from '@apollo/client';
import { useLazyQuery } from '@apollo/client/react';

const AdminContext = createContext();

const ADMIN_LOGIN = gql`
  query AdminLogin($password: String!) {
    adminLogin(password: $password)
  }
`;

export const AdminProvider = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loginError, setLoginError] = useState('');

    const [doLogin, { loading }] = useLazyQuery(ADMIN_LOGIN, {
        fetchPolicy: 'no-cache',
    });

    const login = async (password) => {
        setLoginError('');
        try {
            const { data, error } = await doLogin({ variables: { password } });
            if (error || !data?.adminLogin) {
                setLoginError('Invalid password');
                return false;
            }
            setIsAdmin(true);
            return true;
        } catch (e) {
            setLoginError(e.message || 'Login failed');
            return false;
        }
    };

    const logout = () => setIsAdmin(false);

    return (
        <AdminContext.Provider value={{ isAdmin, login, logout, loading, loginError }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => useContext(AdminContext);