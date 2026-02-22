import React from 'react';

export const AuthenticationNeeded = ({ header, message }) => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px'
        }}>
            <div className="panel" style={{ padding: '20px', textAlign: 'center', border: '1px solid var(--ink-mid)', maxWidth: '600px' }}>
                <h2 style={{ color: 'var(--ink-high)' }}>{header || 'Authentication Required'}</h2>
                <p style={{ color: 'var(--ink-mid)' }}>{message || 'You must be authenticated to access this section.'}</p>
            </div>
        </div>
    );
};