import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../assets/style/pages/Profile.css';
import '../assets/style/Common.css';
import NavBar from '../components/NavBar'
import { PatchNotes } from '../components/PatchNotes'
import { WikiHelp } from '../components/Wiki'
import { formatNumberFull, formatRelativeTime, formatToRealTime, formatNumberShort, formatDurationToHours } from '../utils/Utils';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useTranslation } from 'react-i18next';

const USER_PROFILE_QUERY = gql`
query user($username: String!) {
  user_by_username(username: $username) {
    id
    username
    rank
    is_friend
    date_created
    last_run {
      date
      duration
      wave
      score
    }
    stats {
      high_score
      best_wave
      total_kills
      best_time
      total_games
      total_time
      avg_wave
      total_score
      total_boss_kills
      total_runs_past_20
    }
    runs(first: 3, offset: 0) {
      date
      score
      wave
      duration
    }
  }
}
`

const ME_QUERY = gql`
query MeStats {
    me {
        stats {
            avg_wave
            total_score
            total_boss_kills
            total_runs_past_20
        }
        runs(first: 3, offset: 0) {
            date
            score
            wave
            duration
        }
    }
}
`

const ADD_FRIEND = gql`
  mutation FriendAdd($userId: ID!) {
    addFriend(userId: $userId)
  }
`

const REMOVE_FRIEND = gql`
  mutation FriendDelete($userId: ID!) {
    deleteFriend(userId: $userId)
  }
`

export default function Profile() {
    const { t } = useTranslation();
    const { username } = useParams();
    const { user: loggedInUser, isLoggedIn, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    
    // Déterminer si on regarde son propre profil
    const isOwnProfile = !username || (loggedInUser && username === loggedInUser.username);

    // Requête pour un autre utilisateur
    const { data: userData, loading: userDataLoading, refetch: refetchUser } = useQuery(USER_PROFILE_QUERY, {
        variables: { username: username },
        skip: isOwnProfile || authLoading,
    });

    // Requête pour soi-même (pour avoir les stats complètes et les runs)
    const { data: meData, loading: meDataLoading } = useQuery(ME_QUERY, {
        skip: !isOwnProfile || authLoading,
    });

    const [addFriendMutation] = useMutation(ADD_FRIEND);
    const [removeFriendMutation] = useMutation(REMOVE_FRIEND);

    // On unifie les données : on fusionne l'user de l'auth avec les stats/runs de la query
    const displayUser = isOwnProfile 
        ? (meData?.me ? { ...loggedInUser, ...meData.me, stats: {...loggedInUser?.stats, ...meData.me.stats} } : loggedInUser)
        : userData?.user_by_username;

    // On ne bloque le chargement principal que si on n'a pas encore l'auth ou si on attend les datas d'un autre
    const loading = authLoading || (!isOwnProfile && userDataLoading);
    const statsLoading = isOwnProfile ? meDataLoading : userDataLoading;

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            navigate('/auth');
        }
    }, [isLoggedIn, authLoading, navigate]);

    const handleAddFriend = async () => {
        if (!displayUser?.id) return;
        try {
            await addFriendMutation({ variables: { userId: displayUser.id } });
            await refetchUser();
        } catch (err) {
            console.error("Add friend error", err);
        }
    };

    const handleRemoveFriend = async () => {
        if (!displayUser?.id) return;
        try {
            await removeFriendMutation({ variables: { userId: displayUser.id } });
            await refetchUser();
        } catch (err) {
            console.error("Remove friend error", err);
        }
    };

    if (loading) return (
        <>
            <NavBar />
            <div className="profile-container">Loading...</div>
        </>
    );

    if (!displayUser && !loading) return (
        <>
            <NavBar />
            <div className="profile-container">User not found</div>
        </>
    );

    return (
        <>
            <NavBar />
            <PatchNotes />
            <WikiHelp />
            <div className="profile-container">
                <aside className="profile-sidebar">
                    <div className="profile-card">
                        <div className="avatar-large">{displayUser?.username.substring(0, 2).toUpperCase()}</div>
                        <h1 className="username">{displayUser?.username}</h1>
                        <span className="identity-rank">{t("account.globalRank", {rank: displayUser?.rank || 'N/A'})}</span>
                        <span className="identity-since">{t("account.memberSince", {since: new Date(displayUser?.date_created).toDateString()})}</span>
                        
                        <div style={{ textAlign: 'center', margin: '15px 0' }}>
                            {!isOwnProfile ?
                                displayUser?.is_friend ? 
                                    <button className="btn-remove-friend" onClick={handleRemoveFriend}>{t('friends.removeButton')}</button>
                                :
                                    <button className="btn-add-friend" onClick={handleAddFriend}>{t('friends.addButton')}</button>
                            :
                                <Link to="/account"><button className="btn-edit-profile">{t('account.updateButton')}</button></Link>
                            }
                        </div>
                    </div>

                    <div className="last-run-banner">
                        <div className="lr-label">{t("account.lastRun", {since: formatRelativeTime(displayUser?.last_run?.date)})}</div>
                        <div className="lr-main">
                            <div>
                                {displayUser?.last_run === null ?
                                <div className="lr-score">...</div>
                                :
                                <>
                                    <div className="lr-score">{formatNumberFull(displayUser?.last_run.score)} pts</div>
                                    <div className="lr-sub">{t("game.wave",{ number: displayUser?.last_run.wave})} · {formatToRealTime(displayUser?.last_run.duration)}</div>
                                </>}
                            </div>
                            {/* TODO: ADD WEAPON <span className="lr-tag">{stats.favoriteWeapon}</span> */}
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-header">
                            <span className="panel-title">{t("account.achievements.title")}</span>
                            <span className="tag-blue">{t("utils.comingSoon")}</span>
                        </div>
                        <div className="panel-body-compact">
                            <div className="ach-grid-preview">
                                {/* {stats.achievements.map((ach, i) => (
                                    <div key={i} className={`ach-icon-mini ${ach.unlocked ? '' : 'locked'}`} data-tip={ach.title}>
                                        {ach.unlocked ? ach.icon : '🔒'}
                                    </div>
                                ))} */}
                                {[...Array(6)].map((_, i) => (
                                    <div key={i+10} className="ach-icon-mini locked">🔒</div>
                                ))}
                            </div>
                            {/* <div className="ach-progress-bar">
                                <div className="ach-progress-fill" style={{ width: '50%' }}></div>
                            </div> */}
                            {/* <button className="btn-view-all">View all achievements →</button> */}
                        </div>
                    </div>
                </aside>

                <main className="profile-main">
                    <div className="kpi-row">
                        <div className="kpi-box" style={{ transform: 'rotate(-0.5deg)' }}>
                            <div className="kpi-icon">🏆</div>
                            <div className="kpi-val" style={{ color: 'var(--blue)' }}>{formatNumberFull(displayUser?.stats.high_score)}</div>
                            <div className="kpi-lbl">{t("accountStats.highScore")}</div>
                        </div>
                        <div className="kpi-box" style={{ transform: 'rotate(0.5deg)' }}>
                            <div className="kpi-icon">🌊</div>
                            <div className="kpi-val" style={{ color: 'var(--green)' }}>{displayUser?.stats.best_wave}</div>
                            <div className="kpi-lbl">{t("accountStats.bestWave")}</div>
                        </div>
                        <div className="kpi-box" style={{ transform: 'rotate(-0.3deg)' }}>
                            <div className="kpi-icon">⚔️</div>
                            <div className="kpi-val" style={{ color: 'var(--red)' }}>{formatNumberShort(displayUser?.stats.total_kills)}</div>
                            <div className="kpi-lbl">{t("accountStats.totalKills")}</div>
                        </div>
                        <div className="kpi-box" style={{ transform: 'rotate(0.2deg)' }}>
                            <div className="kpi-icon">⏱️</div>
                            <div className="kpi-val">{formatDurationToHours(displayUser?.stats.best_time)}</div>
                            <div className="kpi-lbl">{t("accountStats.bestRun")}</div>
                        </div>
                    </div>

                    <section className="panel">
                        <div className="panel-header">
                            <span className="panel-title">{t("account.recentRecords")}</span>
                        </div>
                        <div className="panel-body">
                            <div className="history-table">
                                <div className="history-row header">
                                    <span>{t("account.recentRecordsTable.date")}</span>
                                    <span>{t("account.recentRecordsTable.score")}</span>
                                    <span>{t("account.recentRecordsTable.wave")}</span>
                                    <span>{t("account.recentRecordsTable.duration")}</span>
                                </div>
                                {displayUser?.runs ? displayUser?.runs.map((run, i) => (
                                    <div key={i} className="history-row">
                                        <span>{new Date(run.date).toLocaleString()}</span>
                                        <span className="score-val">{formatNumberFull(run.score)}</span>
                                        <span><span className="wave-tag">{run.wave}</span></span>
                                        <span>{formatToRealTime(run.duration)}</span>
                                    </div>
                                )): ""}
                            </div>
                        </div>
                    </section>

                    <section className="panel">
                        <div className="panel-header">
                            <span className="panel-title">{t("account.detailedStatistics.title")}</span>
                        </div>
                        <div className="panel-body">
                            <div className="detailed-stats-grid">
                                <div>
                                    <div className="stats-section-title">{t("account.detailedStatistics.combatTitle")}</div>
                                    <div className="build-kv">
                                        <span className="build-k">{t("account.detailedStatistics.avgScoreRun")}</span>
                                        <span className="build-v">{formatNumberFull(Math.round((displayUser?.stats.total_score || 0) / (displayUser?.stats.total_games || 1)))}</span>
                                    </div>
                                    <div className="build-kv">
                                        <span className="build-k">{t("account.detailedStatistics.avgWaveReached")}</span>
                                        <span className="build-v">{(displayUser?.stats.avg_wave || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="build-kv">
                                        <span className="build-k">{t("account.detailedStatistics.avgKillsRun")}</span>
                                        <span className="build-v">{((displayUser?.stats.total_kills || 0) / (displayUser?.stats.total_games || 1)).toFixed(2)}</span>
                                    </div>
                                    <div className="build-kv">
                                        <span className="build-k">{t("account.detailedStatistics.killRate")}</span>
                                        <span className="build-v">{t("account.detailedStatistics.killRateValue", { value: ((displayUser?.stats.total_kills || 0) / (displayUser?.stats.total_time || 1) * 60).toFixed(2) })}</span>
                                    </div>
                                    <div className="build-kv">
                                        <span className="build-k">{t("account.detailedStatistics.bossKills")}</span>
                                        <span className="build-v">{displayUser?.stats.total_boss_kills || 0}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="stats-section-title">{t("account.detailedStatistics.survivalTitle")}</div>
                                    <div className="build-kv">
                                        <span className="build-k">{t("account.detailedStatistics.avgRunLength")}</span>
                                        <span className="build-v">{formatToRealTime(Math.round((displayUser?.stats.total_time || 0) / (displayUser?.stats.total_games || 1)))}</span>
                                    </div>
                                    <div className="build-kv">
                                        <span className="build-k">{t("account.detailedStatistics.longestRun")}</span>
                                        <span className="build-v">{formatToRealTime(displayUser?.stats.best_time)}</span>
                                    </div>
                                    <div className="build-kv">
                                        <span className="build-k">{t("account.detailedStatistics.totalPlaytime")}</span>
                                        <span className="build-v">{formatToRealTime(displayUser?.stats.total_time)}</span>
                                    </div>
                                    <div className="build-kv">
                                        <span className="build-k">{t("account.detailedStatistics.runsPast20")}</span>
                                        <span className="build-v">{displayUser?.stats.total_runs_past_20 || 0}</span>
                                    </div>
                                    <div className="build-kv">
                                        <span className="build-k">{t("account.detailedStatistics.favouriteWeapon")}</span>
                                        <span className="build-v">{t("utils.comingSoon")}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
