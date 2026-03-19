import React, { useState, useCallback } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import { sha256 } from 'js-sha256';
import { AdminProvider, useAdmin } from '../context/AdminContext';
import { formatNumberFull } from '../utils/Utils';
import '../assets/style/pages/Admin.css';

const GET_RUNS = gql`
  query AdminRuns(
    $page: Int, $limit: Int, $username: String,
    $cheaterOnly: Boolean, $minScore: Int, $maxScore: Int,
    $sortBy: String, $sortDir: String
  ) {
    adminRuns(
      page: $page, limit: $limit, username: $username,
      cheaterOnly: $cheaterOnly, minScore: $minScore, maxScore: $maxScore,
      sortBy: $sortBy, sortDir: $sortDir
    ) {
      total
      runs { id user_id username date score duration wave kills cheater }
    }
  }
`;

const SEARCH_USERS = gql`
  query AdminSearchUsers($query: String!) {
    adminSearchUsers(query: $query) {
      id username email cheater date_created last_online run_count
    }
  }
`;

const DELETE_RUN = gql`mutation AdminDeleteRun($runId: ID!) { adminDeleteRun(runId: $runId) }`;
const DELETE_RUNS_BY_USER = gql`mutation AdminDeleteRunsByUser($userId: ID!) { adminDeleteRunsByUser(userId: $userId) }`;
const SET_CHEATER = gql`mutation AdminSetCheater($userId: ID!, $cheater: Boolean!) { adminSetCheater(userId: $userId, cheater: $cheater) }`;
const DELETE_USER = gql`mutation AdminDeleteUser($userId: ID!) { adminDeleteUser(userId: $userId) }`;
const RESET_PASSWORD = gql`mutation AdminResetPassword($userId: ID!, $newPassword: String!) { adminResetPassword(userId: $userId, newPassword: $newPassword) }`;

const fmtDuration = (secs) => {
    if (!secs && secs !== 0) return '—';
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
};

const fmtDate = (ts) => {
    if (!ts) return '—';
    const d = new Date(typeof ts === 'string' ? ts : Number(ts));
    return d.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const fmtRelative = (ts) => {
    if (!ts) return 'never';
    const diff = Date.now() - Number(ts);
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

function LoginScreen() {
    const { login, loading, loginError } = useAdmin();
    const [pw, setPw] = useState('');
    const handleSubmit = async (e) => { e.preventDefault(); await login(pw); };

    return (
        <div className="admin-login-wrap">
            <div className="panel admin-login-panel">
                <div className="panel-header">
                    <span className="panel-title">Admin panel</span>
                    <span className="tag">⚙ restricted</span>
                </div>
                <div className="panel-body">
                    <p className="admin-login-intro">This area is for authorised administrators only.</p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="label">admin password</div>
                            <input
                                type="password" placeholder="••••••••"
                                value={pw} onChange={e => setPw(e.target.value)}
                                autoFocus disabled={loading}
                            />
                        </div>
                        {loginError && <div className="notif notif-error">{loginError}</div>}
                        <button type="submit" className="btn btn-primary btn-block admin-login-btn" disabled={loading}>
                            {loading ? 'Authenticating…' : 'Enter →'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function FilterBar({ filters, setFilters, onApply }) {
    const [local, setLocal] = useState(filters);
    const set = (k, v) => setLocal(prev => ({ ...prev, [k]: v }));

    const apply = () => { setFilters(local); onApply(local); };
    const reset = () => {
        const def = { username: '', cheaterOnly: false, minScore: '', maxScore: '', sortBy: 'date', sortDir: 'desc' };
        setLocal(def); setFilters(def); onApply(def);
    };

    return (
        <div className="panel admin-filter-panel">
            <div className="panel-header">
                <span className="panel-title admin-panel-title-sm">filters</span>
            </div>
            <div className="panel-body admin-filter-body">
                <div className="admin-filter-field">
                    <div className="label">username</div>
                    <input type="text" placeholder="search player…" value={local.username}
                        onChange={e => set('username', e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && apply()} />
                </div>
                <div className="admin-filter-field-sm">
                    <div className="label">min score</div>
                    <input type="number" placeholder="0" value={local.minScore}
                        onChange={e => set('minScore', e.target.value)} />
                </div>
                <div className="admin-filter-field-sm">
                    <div className="label">max score</div>
                    <input type="number" placeholder="∞" value={local.maxScore}
                        onChange={e => set('maxScore', e.target.value)} />
                </div>
                <div className="admin-filter-field-select">
                    <div className="label">sort by</div>
                    <select value={local.sortBy} onChange={e => set('sortBy', e.target.value)}>
                        <option value="date">date</option>
                        <option value="score">score</option>
                        <option value="wave">wave</option>
                        <option value="kills">kills</option>
                        <option value="duration">duration</option>
                    </select>
                </div>
                <div className="admin-filter-field-select-sm">
                    <div className="label">order</div>
                    <select value={local.sortDir} onChange={e => set('sortDir', e.target.value)}>
                        <option value="desc">↓ desc</option>
                        <option value="asc">↑ asc</option>
                    </select>
                </div>
                <div className="admin-filter-checkbox-wrap">
                    <label className="admin-filter-checkbox-label">
                        <input type="checkbox" checked={local.cheaterOnly}
                            onChange={e => set('cheaterOnly', e.target.checked)} />
                        cheaters only
                    </label>
                </div>
                <div className="admin-filter-actions">
                    <button className="btn btn-primary btn-sm" onClick={apply}>Apply</button>
                    <button className="btn btn-outline btn-sm" onClick={reset}>Reset</button>
                </div>
            </div>
        </div>
    );
}

function RunsTable({ runs, total, page, setPage, limit, refetch }) {
    const [deleteRun] = useMutation(DELETE_RUN);
    const [deleteByUser] = useMutation(DELETE_RUNS_BY_USER);
    const [setCheater] = useMutation(SET_CHEATER);
    const [confirmId, setConfirmId] = useState(null);
    const [confirmType, setConfirmType] = useState(null);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const confirmAction = (id, type, action) => {
        if (confirmId === id && confirmType === type) {
            action().then(() => { setConfirmId(null); setConfirmType(null); refetch(); });
        } else {
            setConfirmId(id); setConfirmType(type);
            setTimeout(() => setConfirmId(null), 3000);
        }
    };

    return (
        <div className="panel">
            <div className="panel-header">
                <span className="panel-title admin-panel-title-sm">runs</span>
                <div className="admin-runs-header-right">
                    <span className="tag">{formatNumberFull(total)} total</span>
                    <div className="admin-pagination">
                        <button className="btn btn-outline btn-sm admin-pagination-btn"
                            disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
                        <span className="admin-pagination-info">{page} / {totalPages}</span>
                        <button className="btn btn-outline btn-sm admin-pagination-btn"
                            disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</button>
                    </div>
                </div>
            </div>
            <div className="admin-table-wrap">
                <table className="admin-table admin-table-runs">
                    <thead>
                        <tr>
                            <th>player</th>
                            <th>score</th>
                            <th>wave</th>
                            <th>kills</th>
                            <th>duration</th>
                            <th>date</th>
                            <th>flag</th>
                            <th>actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {runs.length === 0 && (
                            <tr><td colSpan={8} className="admin-td-empty">no runs found</td></tr>
                        )}
                        {runs.map((run, i) => (
                            <tr key={run.id} className={
                                run.cheater ? 'admin-tr-cheater' : i % 2 === 0 ? 'admin-tr-even' : 'admin-tr-odd'
                            }>
                                <td>
                                    <div className="admin-td-player">
                                        <span className={run.cheater ? 'admin-td-player-name-cheater' : 'admin-td-player-name'}>
                                            {run.username ?? <span className="admin-td-player-deleted">deleted</span>}
                                        </span>
                                        {run.cheater && <span className="admin-td-cheater-badge">⚠</span>}
                                    </div>
                                </td>
                                <td className="admin-td-score">{formatNumberFull(run.score)}</td>
                                <td className="admin-td-number">{run.wave}</td>
                                <td className="admin-td-number">{run.kills}</td>
                                <td className="admin-td-duration">{fmtDuration(run.duration)}</td>
                                <td className="admin-td-date">{fmtDate(run.date)}</td>
                                <td>
                                    {run.user_id && (
                                        <button
                                            className={`btn btn-sm admin-btn-flag ${run.cheater ? 'btn-outline' : 'btn-danger'}`}
                                            onClick={() => setCheater({ variables: { userId: run.user_id, cheater: !run.cheater } }).then(refetch)}
                                        >
                                            {run.cheater ? 'unflag' : 'flag'}
                                        </button>
                                    )}
                                </td>
                                <td>
                                    <div className="admin-td-actions">
                                        <button className="btn btn-danger btn-sm admin-btn-action"
                                            onClick={() => confirmAction(run.id, 'run', () => deleteRun({ variables: { runId: run.id } }))}>
                                            {confirmId === run.id && confirmType === 'run' ? 'sure?' : 'del run'}
                                        </button>
                                        {run.user_id && (
                                            <button className="btn btn-danger btn-sm admin-btn-action-dim"
                                                onClick={() => confirmAction(`all_${run.id}`, 'allRuns', () => deleteByUser({ variables: { userId: run.user_id } }))}>
                                                {confirmId === `all_${run.id}` && confirmType === 'allRuns' ? 'sure?' : 'del all'}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ResetPasswordModal({ user, onClose }) {
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resetPassword, { loading }] = useMutation(RESET_PASSWORD);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (newPw.length < 4) { setError('Password must be at least 4 characters.'); return; }
        if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
        try {
            // sha256-hash before sending, the login flow does the same on the client.
            const { data } = await resetPassword({
                variables: { userId: user.id, newPassword: sha256(newPw) },
            });
            if (data?.adminResetPassword) {
                setSuccess(true);
                setTimeout(onClose, 1200);
            } else {
                setError('Failed to reset password.');
            }
        } catch (err) {
            setError(err.message || 'Unexpected error.');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="panel admin-reset-modal" onClick={e => e.stopPropagation()}>
                <div className="panel-header">
                    <span className="panel-title admin-reset-modal-title">Reset password</span>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <p className="admin-reset-modal-subtitle">
                        Resetting password for <strong>{user.username}</strong>
                    </p>
                    {success && <div className="notif admin-reset-success">✓ Password updated!</div>}
                    {error && <div className="notif notif-error">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="label">new password</div>
                            <input type="password" value={newPw}
                                onChange={e => setNewPw(e.target.value)}
                                placeholder="min. 4 chars" autoFocus disabled={loading || success} />
                        </div>
                        <div className="form-row">
                            <div className="label">confirm password</div>
                            <input type="password" value={confirmPw}
                                onChange={e => setConfirmPw(e.target.value)}
                                placeholder="again…" disabled={loading || success} />
                        </div>
                        <div className="admin-reset-modal-footer">
                            <button type="button" className="btn btn-outline btn-sm"
                                onClick={onClose} disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary btn-sm"
                                disabled={loading || success}>
                                {loading ? 'Saving…' : 'Reset password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function UserRow({ user, onAction }) {
    const [setCheater] = useMutation(SET_CHEATER);
    const [deleteUser] = useMutation(DELETE_USER);
    const [confirmDel, setConfirmDel] = useState(false);
    const [showReset, setShowReset] = useState(false);

    const handleDelete = async () => {
        if (!confirmDel) {
            setConfirmDel(true);
            setTimeout(() => setConfirmDel(false), 3000);
            return;
        }
        await deleteUser({ variables: { userId: user.id } });
        onAction();
    };

    const handleToggleCheater = async () => {
        await setCheater({ variables: { userId: user.id, cheater: !user.cheater } });
        onAction();
    };

    return (
        <>
            {showReset && <ResetPasswordModal user={user} onClose={() => setShowReset(false)} />}
            <tr className={user.cheater ? 'admin-tr-cheater' : 'admin-tr-even'}>
                <td>
                    <div className="admin-td-player">
                        <span className={user.cheater ? 'admin-td-player-name-cheater' : 'admin-td-player-name'}>
                            {user.username}
                        </span>
                        {user.cheater && <span className="admin-td-cheater-badge">⚠</span>}
                    </div>
                </td>
                <td className="admin-td-email">{user.email}</td>
                <td className="admin-td-number">{user.run_count ?? 0}</td>
                <td className="admin-td-date">{fmtRelative(user.last_online)}</td>
                <td className="admin-td-date">{fmtDate(user.date_created)}</td>
                <td>
                    <div className="admin-td-actions admin-td-actions-wrap">
                        <button
                            className={`btn btn-sm admin-btn-flag ${user.cheater ? 'btn-outline' : 'btn-danger'}`}
                            onClick={handleToggleCheater}
                        >
                            {user.cheater ? 'unflag' : 'flag'}
                        </button>
                        <button className="btn btn-outline btn-sm admin-btn-action"
                            onClick={() => setShowReset(true)}>
                            reset pw
                        </button>
                        <button className="btn btn-danger btn-sm admin-btn-action"
                            onClick={handleDelete}>
                            {confirmDel ? 'sure?' : 'delete'}
                        </button>
                    </div>
                </td>
            </tr>
        </>
    );
}

function UsersTab() {
    const [query, setQuery] = useState('');
    const [submitted, setSubmitted] = useState('');
    const [searchUsers, { data, loading, error }] = useLazyQuery(SEARCH_USERS, {
        fetchPolicy: 'network-only',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setSubmitted(query.trim());
        searchUsers({ variables: { query: query.trim() } });
    };

    const refetch = () => {
        if (submitted) searchUsers({ variables: { query: submitted } });
    };

    const users = data?.adminSearchUsers || [];

    return (
        <div>
            <div className="panel admin-filter-panel">
                <div className="panel-header">
                    <span className="panel-title admin-panel-title-sm">user search</span>
                </div>
                <div className="panel-body">
                    <form className="admin-user-search-form" onSubmit={handleSearch}>
                        <div className="admin-filter-body">
                            <div className="admin-filter-field admin-user-search-input">
                                <div className="label">search by username or email</div>
                                <input
                                    type="text"
                                    placeholder="username or email@example.com…"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="admin-filter-actions">
                                <button type="submit" className="btn btn-primary btn-sm"
                                    disabled={loading || !query.trim()}>
                                    {loading ? 'Searching…' : 'Search'}
                                </button>
                                {submitted && (
                                    <button type="button" className="btn btn-outline btn-sm"
                                        onClick={() => { setQuery(''); setSubmitted(''); }}>
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {error && (
                <div className="notif notif-error admin-error">Error: {error.message}</div>
            )}

            {submitted && !loading && (
                <div className="panel">
                    <div className="panel-header">
                        <span className="panel-title admin-panel-title-sm">results</span>
                        <span className="tag">{users.length} user{users.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="admin-table-wrap">
                        <table className="admin-table admin-table-users">
                            <thead>
                                <tr>
                                    <th>username</th>
                                    <th>email</th>
                                    <th>runs</th>
                                    <th>last online</th>
                                    <th>joined</th>
                                    <th>actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="admin-td-empty">
                                            no users found for "{submitted}"
                                        </td>
                                    </tr>
                                )}
                                {users.map(u => (
                                    <UserRow key={u.id} user={u} onAction={refetch} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!submitted && (
                <div className="admin-users-empty-hint">
                    Search for a user by username or email address.
                </div>
            )}
        </div>
    );
}

const DEFAULT_FILTERS = {
    username: '', cheaterOnly: false, minScore: '', maxScore: '',
    sortBy: 'date', sortDir: 'desc',
};
const LIMIT = 50;

function buildVars(f) {
    return {
        username: f.username || undefined,
        cheaterOnly: f.cheaterOnly || undefined,
        minScore: f.minScore !== '' ? parseInt(f.minScore) : undefined,
        maxScore: f.maxScore !== '' ? parseInt(f.maxScore) : undefined,
        sortBy: f.sortBy,
        sortDir: f.sortDir,
    };
}

function AdminPanelInner() {
    const { logout } = useAdmin();
    const [activeTab, setActiveTab] = useState('runs');

    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [queryVars, setQueryVars] = useState({ page: 1, limit: LIMIT, ...buildVars(DEFAULT_FILTERS) });

    const applyFilters = useCallback((f) => {
        setPage(1);
        setQueryVars({ page: 1, limit: LIMIT, ...buildVars(f) });
    }, []);

    React.useEffect(() => {
        setQueryVars(prev => ({ ...prev, page }));
    }, [page]);

    const { data, loading, error, refetch } = useQuery(GET_RUNS, {
        variables: queryVars,
        fetchPolicy: 'network-only',
        skip: activeTab !== 'runs',
    });

    const runs = data?.adminRuns?.runs || [];
    const total = data?.adminRuns?.total || 0;

    return (
        <div className="main admin-main">
            <div className="admin-page-header">
                <div className="admin-page-header-left">
                    <span className="admin-page-title">Admin panel</span>
                    <span className="annotation">⚙ danger zone</span>
                </div>
                <button className="btn btn-outline btn-sm" onClick={logout}>sign out</button>
            </div>

            <div className="tabs admin-tabs">
                <div className={`tab ${activeTab === 'runs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('runs')}>
                    Runs
                </div>
                <div className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}>
                    Users
                </div>
            </div>

            {activeTab === 'runs' && (
                <>
                    {error && <div className="notif notif-error admin-error">Error: {error.message}</div>}
                    <FilterBar filters={filters} setFilters={setFilters} onApply={applyFilters} />
                    {loading
                        ? <div className="admin-loading">loading runs…</div>
                        : <RunsTable runs={runs} total={total} page={page} setPage={setPage}
                            limit={LIMIT} refetch={refetch} />
                    }
                </>
            )}

            {activeTab === 'users' && <UsersTab />}
        </div>
    );
}

function AdminPageInner() {
    const { isAdmin } = useAdmin();
    return isAdmin ? <AdminPanelInner /> : <LoginScreen />;
}

function AdminPage() {
    return (
        <AdminProvider>
            <AdminPageInner />
        </AdminProvider>
    );
}

export default AdminPage;