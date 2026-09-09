import { useTranslation } from 'react-i18next';
import { formatToRealTime } from '../utils/Utils';
import '../assets/style/components/WaveStatsPanel.css';

const ENEMY_COLORS = {
    runner: '#e74c3c',
    brute: '#8e44ad',
    shooter: '#e67e22',
    boss: '#c0392b'
};

function StatDelta({ value }) {
    if (value === null || value === undefined) return null;
    if (value === 0) return <span className="wsp-delta neutral">±0%</span>;
    const up = value > 0;
    return <span className={`wsp-delta ${up ? 'up' : 'down'}`}>{up ? '▲' : '▼'} {Math.abs(value)}%</span>;
}

export default function WaveStatsPanel({ recap, preview }) {
    const { t } = useTranslation();
    if (!recap && (!preview || preview.length === 0)) return null;

    return (
        <div className="wave-stats-panel">
            {recap && (
                <div className="wsp-recap">
                    <div className="wsp-recap-title">{t('waveStats.cleared', { wave: recap.waveNumber })}</div>
                    <div className="wsp-recap-grid">
                        <div className="wsp-recap-stat">
                            <span className="wsp-recap-label">{t('waveStats.time')}</span>
                            <span className="wsp-recap-value">{formatToRealTime(Math.round(recap.timeTaken))}</span>
                        </div>
                        <div className="wsp-recap-stat">
                            <span className="wsp-recap-label">{t('waveStats.dealt')}</span>
                            <span className="wsp-recap-value dealt">{Math.round(recap.damageDealt).toLocaleString()}</span>
                        </div>
                        <div className="wsp-recap-stat">
                            <span className="wsp-recap-label">{t('waveStats.taken')}</span>
                            <span className="wsp-recap-value taken">{Math.round(recap.damageTaken).toLocaleString()}</span>
                        </div>
                        <div className="wsp-recap-stat">
                            <span className="wsp-recap-label">{t('waveStats.kills')}</span>
                            <span className="wsp-recap-value">
                                {Object.entries(recap.kills).map(([type, n]) => (
                                    <span key={type} className="wsp-kill-chip">
                                        <span
                                            className="wsp-enemy-dot"
                                            style={{ backgroundColor: ENEMY_COLORS[type] || '#ccc' }}
                                        />
                                        {n}
                                    </span>
                                ))}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {preview && preview.length > 0 && (
                <div className="wsp-preview">
                    <div className="wsp-preview-title">{t('waveStats.incoming')}</div>
                    <div className="wsp-preview-list">
                        {preview.map(enemy => (
                            <div className="wsp-enemy-row" key={enemy.type}>
                                <span className="wsp-enemy-dot" style={{ backgroundColor: enemy.color }} />
                                <span className="wsp-enemy-name">
                                    {t(`wiki.enemies.${enemy.type}.name`)}
                                    {enemy.isNew && <span className="wsp-new-tag">{t('waveStats.new')}</span>}
                                </span>
                                <span className="wsp-enemy-count">×{enemy.count}</span>
                                <span className="wsp-enemy-stat">{t('waveStats.hp')} {enemy.stats.hp} <StatDelta value={enemy.deltas?.hp} /></span>
                                <span className="wsp-enemy-stat">{t('waveStats.dmg')} {enemy.stats.damage} <StatDelta value={enemy.deltas?.damage} /></span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}