import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const FriendsContext = createContext();

export const FriendsProvider = ({ children }) => {
    const { user, isLoggedIn } = useAuth();
    const [friends, setFriends] = useState([]);
    const [pending_requests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchFriends = async () => {
        if (!isLoggedIn) return;
        
        setLoading(true);
        try {
            const response = await fetch('/api/user/friends');
            if (response.ok) {
                const data = await response.json();
                setFriends(data.filter(x => !x.pending))
                setPendingRequests(data.filter(x => x.pending))
            } else {
                setError('Failed to fetch friends');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchFriends();
        } else {
            setFriends([]);
        }
    }, [isLoggedIn]);

    const removeFriend = async (friendId) => {
        try {
            const response = await fetch(`/api/user/${friendId}/remove`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setFriends(prev => prev.filter(f => f.id !== friendId));
                setPendingRequests(prev => prev.filter(f => f.id !== friendId));
            }
        } catch (err) {
            console.error("Failed to remove friend:", err);
        }
    };

    const addFriend = async (friendId) => {
        try {
            const response = await fetch(`/api/user/${friendId}/add`, {
                method: 'POST',
            });
            if (response.ok) {
                await fetchFriends()
            }
        } catch (err) {
            console.error("Failed to add friend:", err);
        }
    }

    return (
        <FriendsContext.Provider value={{ 
            friends, 
            loading, 
            error,
            pending_requests,
            refreshFriends: fetchFriends,
            addFriend,
            removeFriend 
        }}>
            {children}
        </FriendsContext.Provider>
    );
};

export const useFriends = () => useContext(FriendsContext);
