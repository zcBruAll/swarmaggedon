import React, { createContext, useState, useEffect, useContext } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';

const AuthContext = createContext();

const ME_QUERY = gql`
  query Me {
    me {
      id
      username
      email
      date_created
      rank
      last_run {
        date
        score
        duration
        wave
      }
      stats {
        total_games
        high_score
        best_time
        best_wave
        total_kills
        total_time
      }
    }
  }
`;

const MUTATION_LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const AuthProvider = ({ children }) => {
    const client = useApolloClient();
    const { data, loading: queryLoading, refetch } = useQuery(ME_QUERY, {
        errorPolicy: 'all',
        onError: () => {} // ignore errors (not logged in)
    });
    
    const [logoutMutation] = useMutation(MUTATION_LOGOUT);
    
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!queryLoading) {
            if (data?.me) {
                setUser(data.me);
                setIsLoggedIn(true);
            } else {
                setUser(null);
                setIsLoggedIn(false);
            }
            setLoading(false);
        }
    }, [data, queryLoading]);

    const checkAuth = async () => {
        setLoading(true);
        try {
            const { data: refetchedData } = await refetch();
            if (refetchedData?.me) {
                setUser(refetchedData.me);
                setIsLoggedIn(true);
            } else {
                setUser(null);
                setIsLoggedIn(false);
            }
        } catch (e) {
            setUser(null);
            setIsLoggedIn(false);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await logoutMutation();
            await client.resetStore();  // reset cache
            setUser(null);
            setIsLoggedIn(false);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn, loading, checkAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
