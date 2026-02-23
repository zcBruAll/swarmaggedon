import { useState, useEffect } from "react";
import { formatNumberFull, formatNumberShort, formatDurationToHours } from "../utils/Utils";

function GlobalStats() {
    const [stats, setStats] = useState({
        players_online: 0,
        total_games: 0,
        total_kills: 0,
        avg_survival_time: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/global/stats');
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch global stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        // Update stats every minute
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="global-bar" style={{ opacity: 0.5 }}>
            <div className="global-stat">Loading global stats...</div>
        </div>
    }

    return <div className="global-bar">
        <div className="global-stat">
            <div className="global-stat-value">{formatNumberFull(stats.players_online)}</div>
            <div>
                <div className="global-stat-title">Players online</div>
                <div className="global-stat-sub">active now</div>
            </div>
        </div>
        <div className="global-stat">
            <div className="global-stat-value">{formatNumberShort(stats.total_games)}</div>
            <div>
                <div className="global-stat-title">Games played</div>
                <div className="global-stat-sub">all time</div>
            </div>
        </div>
        <div className="global-stat">
            <div className="global-stat-value">{formatNumberShort(stats.total_kills)}</div>
            <div>
                <div className="global-stat-title">Enemies killed</div>
                <div className="global-stat-sub">all time</div>
            </div>
        </div>
        <div className="global-stat">
            <div className="global-stat-value">{formatDurationToHours(Math.round(stats.avg_survival_time))}</div>
            <div>
                <div className="global-stat-title">Avg survival time</div>
                <div className="global-stat-sub">global average</div>
            </div>
        </div>
    </div>
}

export default GlobalStats;
