import React, { useState, useCallback } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { AdminProvider, useAdmin } from '../context/AdminContext';
import { formatNumberFull } from '../utils/Utils';
import NavBar from '../components/NavBar';
import { PatchNotes } from '../components/PatchNotes';
import { WikiHelp } from '../components/Wiki';
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
      runs {
        id user_id username date score duration wave kills cheater
      }
    }
  }
`;

const DELETE_RUN = gql`mutation AdminDeleteRun($runId: ID!) { adminDeleteRun(runId: $runId) }`;
const DELETE_RUNS_BY_USER = gql`mutation AdminDeleteRunsByUser($userId: ID!) { adminDeleteRunsByUser(userId: $userId) }`;
const SET_CHEATER = gql`mutation AdminSetCheater($userId: ID!, $cheater: Boolean!) { adminSetCheater(userId: $userId, cheater: $cheater) }`;

const fmt = (secs) => {
    if (!secs && secs !== 0) return '—';
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
};

const relDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

function LoginScreen() {
    const { login, loading, loginError } = useAdmin();
    const [pw, setPw] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        await login(pw);
    };

    return (
        <div className="admin-login-wrap">
            <div className="panel admin-login-panel">
                <div className="panel-header">
                    <span className="panel-title">Admin panel</span>
                    <span className="tag">⚙ restricted</span>
                </div>
                <div className="panel-body">
                    <p className="admin-login-intro">
                        This area is for authorised administrators only.
                    </p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="label">admin password</div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={pw}
                                onChange={e => setPw(e.target.value)}
                                autoFocus
                                disabled={loading}
                            />
                        </div>
                        {loginError && (
                            <div className="notif notif-error">
                                {loginError}
                            </div>
                        )}
                        <button
                            type="submit"
                            className="btn btn-primary btn-block admin-login-btn"
                            disabled={loading}
                        >
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
                    <input
                        type="text"
                        placeholder="search player…"
                        value={local.username}
                        onChange={e => set('username', e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && apply()}
                    />
                </div>
                <div className="admin-filter-field-sm">
                    <div className="label">min score</div>
                    <input
                        type="number"
                        placeholder="0"
                        value={local.minScore}
                        onChange={e => set('minScore', e.target.value)}
                    />
                </div>
                <div className="admin-filter-field-sm">
                    <div className="label">max score</div>
                    <input
                        type="number"
                        placeholder="∞"
                        value={local.maxScore}
                        onChange={e => set('maxScore', e.target.value)}
                    />
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
                        <input
                            type="checkbox"
                            checked={local.cheaterOnly}
                            onChange={e => set('cheaterOnly', e.target.checked)}
                        />
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

    const handleDeleteRun = async (runId) => {
        if (confirmId === runId && confirmType === 'run') {
            await deleteRun({ variables: { runId } });
            setConfirmId(null); setConfirmType(null);
            refetch();
        } else {
            setConfirmId(runId); setConfirmType('run');
            setTimeout(() => setConfirmId(null), 3000);
        }
    };

    const handleDeleteAllRuns = async (userId, runId) => {
        const key = `all_${runId}`;
        if (confirmId === key && confirmType === 'allRuns') {
            await deleteByUser({ variables: { userId } });
            setConfirmId(null); setConfirmType(null);
            refetch();
        } else {
            setConfirmId(key); setConfirmType('allRuns');
            setTimeout(() => setConfirmId(null), 3000);
        }
    };

    const handleToggleCheater = async (userId, current) => {
        await setCheater({ variables: { userId, cheater: !current } });
        refetch();
    };

    return (
        <div className="panel">
            <div className="panel-header">
                <span className="panel-title admin-panel-title-sm">runs</span>
                <div className="admin-runs-header-right">
                    <span className="tag">{formatNumberFull(total)} total</span>
                    <div className="admin-pagination">
                        <button
                            className="btn btn-outline btn-sm admin-pagination-btn"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                        >←</button>
                        <span className="admin-pagination-info">
                            {page} / {totalPages}
                        </span>
                        <button
                            className="btn btn-outline btn-sm admin-pagination-btn"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >→</button>
                    </div>
                </div>
            </div>

            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr>
                            {[
                                { key: 'player', w: '18%' },
                                { key: 'score', w: '11%' },
                                { key: 'wave', w: '7%' },
                                { key: 'kills', w: '7%' },
                                { key: 'duration', w: '10%' },
                                { key: 'date', w: '18%' },
                                { key: 'flag', w: '8%' },
                                { key: 'actions', w: '21%' },
                            ].map(({ key, w }) => (
                                <th key={key} style={{ width: w }}>{key}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {runs.length === 0 && (
                            <tr>
                                <td colSpan={8} className="admin-td-empty">
                                    no runs found
                                </td>
                            </tr>
                        )}
                        {runs.map((run, i) => (
                            <tr
                                key={run.id}
                                className={
                                    run.cheater ? 'admin-tr-cheater'
                                        : i % 2 === 0 ? 'admin-tr-even'
                                            : 'admin-tr-odd'
                                }
                            >
                                {/* player */}
                                <td>
                                    <div className="admin-td-player">
                                        <span className={run.cheater ? 'admin-td-player-name-cheater' : 'admin-td-player-name'}>
                                            {run.username
                                                ? run.username
                                                : <span className="admin-td-player-deleted">deleted</span>
                                            }
                                        </span>
                                        {run.cheater && (
                                            <span className="admin-td-cheater-badge">⚠</span>
                                        )}
                                    </div>
                                </td>
                                {/* score */}
                                <td className="admin-td-score">
                                    {formatNumberFull(run.score)}
                                </td>
                                {/* wave */}
                                <td className="admin-td-number">{run.wave}</td>
                                {/* kills */}
                                <td className="admin-td-number">{run.kills}</td>
                                {/* duration */}
                                <td className="admin-td-duration">{fmt(run.duration)}</td>
                                {/* date */}
                                <td className="admin-td-date">{relDate(run.date)}</td>
                                {/* flag toggle */}
                                <td>
                                    {run.user_id && (
                                        <button
                                            className={`btn btn-sm admin-btn-flag ${run.cheater ? 'btn-outline' : 'btn-danger'}`}
                                            onClick={() => handleToggleCheater(run.user_id, run.cheater)}
                                        >
                                            {run.cheater ? 'unflag' : 'flag'}
                                        </button>
                                    )}
                                </td>
                                {/* actions */}
                                <td>
                                    <div className="admin-td-actions">
                                        <button
                                            className="btn btn-danger btn-sm admin-btn-action"
                                            onClick={() => handleDeleteRun(run.id)}
                                        >
                                            {confirmId === run.id && confirmType === 'run' ? 'sure?' : 'del run'}
                                        </button>
                                        {run.user_id && (
                                            <button
                                                className="btn btn-danger btn-sm admin-btn-action-dim"
                                                onClick={() => handleDeleteAllRuns(run.user_id, run.id)}
                                            >
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

const DEFAULT_FILTERS = {
    username: '', cheaterOnly: false, minScore: '', maxScore: '',
    sortBy: 'date', sortDir: 'desc'
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

            {error && (
                <div className="notif notif-error admin-error">
                    Error: {error.message}
                </div>
            )}

            <FilterBar filters={filters} setFilters={setFilters} onApply={applyFilters} />

            {loading ? (
                <div className="admin-loading">loading runs…</div>
            ) : (
                <RunsTable
                    runs={runs}
                    total={total}
                    page={page}
                    setPage={setPage}
                    limit={LIMIT}
                    refetch={refetch}
                />
            )}
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