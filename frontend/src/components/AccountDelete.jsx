import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../assets/style/components/AccountDelete.css';

const MUTATION_DELETE_ACCOUNT = gql`
  mutation DeleteAccount {
    deleteAccount
  }
`;

export const AccountDelete = ({ user, show, onClose, children }) => {
    const [confirmUsername, setConfirmUsername] = useState('');
    const [error, setError] = useState('');
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [deleteAccount, { loading }] = useMutation(MUTATION_DELETE_ACCOUNT);
    const [confirmDeletion, setConfirmDeletion] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!show) {
            setConfirmUsername('');
            setError('');
            setConfirmDeletion(false);
        }
    }, [show]);

    const handleDelete = async () => {
        if (confirmUsername !== user.username) {
            setError('Username does not match.');
            return;
        }

        if (!confirmDeletion) {
            setConfirmDeletion(true);
            return;
        }

        try {
            const { data } = await deleteAccount();
            if (data.deleteAccount === "Account deleted successfully") {
                await logout();
                navigate('/auth');
            } else {
                setError(data.deleteAccount || 'Failed to delete account');
            }
        } catch (err) {
            setError(err.message || 'An error occurred during account deletion');
        }
    };

    if (!show) return children;

    return (
        <>
            {children}
            <div className="modal-overlay" onClick={onClose}>
                <div className="panel" onClick={e => e.stopPropagation()}>
                    <div className="panel-header" style={{backgroundColor: "#f77"}}>
                        <h2 className="panel-title">Delete Account</h2>
                        <button className="modal-close" onClick={onClose}>&times;</button>
                    </div>
                    <div className="modal-body">
                        <div className="warning-box">
                            <strong>Warning:</strong> This action is permanent and cannot be undone. All your stats, friends, and game history will be lost.
                        </div>
                        
                        {error && (
                            <div style={{ color: 'var(--red)', marginBottom: '15px', fontSize: '14px' }}>
                                {error}
                            </div>
                        )}

                        <div className="confirm-input-group">
                            <div className="label">Please type your username <strong>{user.username}</strong> to confirm:</div>
                            <input 
                                type="text" 
                                value={confirmUsername} 
                                onChange={(e) => setConfirmUsername(e.target.value)}
                                placeholder={user.username}
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-outline btn-sm" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button 
                            className="btn btn-danger btn-sm" 
                            onClick={handleDelete} 
                            disabled={loading || confirmUsername !== user.username}
                        >
                            {confirmDeletion ? "Again..." : loading ? 'Deleting...' : 'Delete Permanently'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
