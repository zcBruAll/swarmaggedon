import { formatNumberFull, formatNumberShort, formatTotalToHours } from "../utils/Utils";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useTranslation } from 'react-i18next';

const GET_GLOBAL_STATS = gql`
  query GlobalStats {
    global {
      stats {
        players_online
        total_survival_time
        total_games
        total_kills
      }
    }
  }
`;

function GlobalStats() {
    const { loading, data } = useQuery(GET_GLOBAL_STATS);
    const { t } = useTranslation();

    return (
        <div className="global-bar">
            <div className="global-stat">
                <div className="global-stat-value">
                    {loading ? "0" : formatNumberFull(data?.global.stats.players_online)}
                </div>
                <div>
                    <div className="global-stat-title">
                        {loading
                            ? t('dashboard.globalBar.playersOnline_other')
                            : t(data?.global.stats.players_online === 1
                                ? 'dashboard.globalBar.playersOnline_one'
                                : 'dashboard.globalBar.playersOnline_other')}
                    </div>
                    <div className="global-stat-sub">{t('dashboard.globalBar.activeNow')}</div>
                </div>
            </div>
            <div className="global-stat">
                <div className="global-stat-value">
                    {loading ? "0" : formatNumberShort(data?.global.stats.total_games)}
                </div>
                <div>
                    <div className="global-stat-title">{t('dashboard.globalBar.gamesPlayed')}</div>
                    <div className="global-stat-sub">{t('dashboard.globalBar.allTime')}</div>
                </div>
            </div>
            <div className="global-stat">
                <div className="global-stat-value">
                    {loading ? "0" : formatNumberShort(data?.global.stats.total_kills)}
                </div>
                <div>
                    <div className="global-stat-title">{t('dashboard.globalBar.enemiesKilled')}</div>
                    <div className="global-stat-sub">{t('dashboard.globalBar.allTime')}</div>
                </div>
            </div>
            <div className="global-stat">
                <div className="global-stat-value">
                    {loading ? "???" : formatTotalToHours(data?.global.stats.total_survival_time).toFixed(1)} hours
                </div>
                <div>
                    <div className="global-stat-title">{t('dashboard.globalBar.totalSurvivalTime')}</div>
                    <div className="global-stat-sub">{t('dashboard.globalBar.global')}</div>
                </div>
            </div>
        </div>
    );
}

export default GlobalStats;