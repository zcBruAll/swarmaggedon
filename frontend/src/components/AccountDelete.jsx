import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import '../assets/style/components/AccountDelete.css';

const MUTATION_DELETE_ACCOUNT = gql`
  mutation DeleteAccount {
    deleteAccount
  }
`;

export const AccountDelete = ({ user, show, onClose, children }) => {
    const { t } = useTranslation();
    const [confirmUsername, setConfirmUsername] = useState('');
    const [error, setError] = useState('');
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [deleteAccount, { loading }] = useMutation(MUTATION_DELETE_ACCOUNT);
    const [confirmDeletion, setConfirmDeletion] = useState(false);

    useEffect(() => {
        if (!show) {
            setConfirmUsername('');
            setError('');
            setConfirmDeletion(false);
        }
    }, [show]);

    const handleDelete = async () => {
        if (confirmUsername !== user.username) {
            setError(t('accountDelete.errors.usernameMismatch'));
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
                setError(data.deleteAccount || t('accountDelete.errors.usernameMismatch'));
            }
        } catch (err) {
            setError(err.message || t('accountDelete.errors.usernameMismatch'));
        }
    };

    if (!show) return children;

    return (
        <>
            {children}
            <div className="modal-overlay" onClick={onClose}>
                <div className="panel" onClick={e => e.stopPropagation()}>
                    <div className="panel-header" style={{ backgroundColor: "#f77" }}>
                        <h2 className="panel-title">{t('accountDelete.title')}</h2>
                        <button className="modal-close" onClick={onClose}>&times;</button>
                    </div>
                    <div className="modal-body">
                        <div className="warning-box">
                            <strong>Warning:</strong> {t('accountDelete.warning')}
                        </div>

                        {error && (
                            <div style={{ color: 'var(--red)', marginBottom: '15px', fontSize: '14px' }}>
                                {error}
                            </div>
                        )}

                        <div className="confirm-input-group">
                            <div className="label">
                                {t('accountDelete.confirmLabel', { username: user.username })}
                            </div>
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
                            {t('accountDelete.cancel')}
                        </button>
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={handleDelete}
                            disabled={loading || confirmUsername !== user.username}
                        >
                            {confirmDeletion
                                ? t('accountDelete.confirmAgain')
                                : loading
                                    ? t('accountDelete.deletingButton')
                                    : t('accountDelete.deleteButton')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};