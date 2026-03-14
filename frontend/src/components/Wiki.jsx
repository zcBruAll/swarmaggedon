import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../assets/style/components/Wiki.css';

function ControlsTab() {
    const { t } = useTranslation();
    return (
        <div className='wiki-body'>
            <div className='wiki-section'>
                <div className='wiki-section-title'>{t('wiki.controls.movement')}</div>
                {[
                    [['W', 'A', 'S', 'D'], t('wiki.controls.keys.moveUpLeftDownRight')],
                    [['↑', '←', '↓', '→'], t('wiki.controls.keys.arrowKeys')],
                ].map(([keys, desc], i) => (
                    <div className='wiki-row' key={i}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', minWidth: '90px' }}>
                            {keys.map(k => <span className='wiki-key' key={k}>{k}</span>)}
                        </div>
                        <span className='wiki-desc'>{desc}</span>
                    </div>
                ))}
            </div>

            <div className='wiki-section'>
                <div className='wiki-section-title'>{t('wiki.controls.combat')}</div>
                {[
                    [['Mouse'], t('wiki.controls.keys.mouseAim')],
                    [['LMB Hold'], t('wiki.controls.keys.lmbCharge')],
                ].map(([keys, desc], i) => (
                    <div className='wiki-row' key={i}>
                        <div style={{ display: 'flex', gap: '4px', minWidth: '90px' }}>
                            {keys.map(k => <span className='wiki-key' key={k}>{k}</span>)}
                        </div>
                        <span className='wiki-desc'>{desc}</span>
                    </div>
                ))}
                <div className='wiki-tip'>{t('wiki.controls.tip')}</div>
            </div>

            <div className='wiki-section'>
                <div className='wiki-section-title'>{t('wiki.controls.game')}</div>
                <div className='wiki-row'>
                    <div style={{ display: 'flex', gap: '4px', minWidth: '90px' }}>
                        <span className='wiki-key'>Esc</span>
                    </div>
                    <span className='wiki-desc'>{t('wiki.controls.keys.escPause')}</span>
                </div>
            </div>

            <div className='wiki-section'>
                <div className='wiki-section-title'>{t('wiki.controls.hudLegend')}</div>
                {[
                    ['Top-right', t('wiki.controls.hud.topRight')],
                    ['Bottom-left', t('wiki.controls.hud.bottomLeft')],
                    ['Bottom-right', t('wiki.controls.hud.bottomRight')],
                    ['Top bar', t('wiki.controls.hud.topBar')],
                ].map(([label, desc], i) => (
                    <div className='wiki-row' key={i}>
                        <span className='wiki-key' style={{ minWidth: '90px', fontSize: '0.8rem' }}>{label}</span>
                        <span className='wiki-desc'>{desc}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EnemiesTab() {
    const { t } = useTranslation();

    const enemies = [
        { key: 'runner', color: '#e74c3c', tagColors: ['#e74c3c', '#7f8c8d'] },
        { key: 'brute', color: '#8e44ad', tagColors: ['#7f8c8d', '#8e44ad', '#c0392b'] },
        { key: 'shooter', color: '#e67e22', tagColors: ['#2471a3', '#e67e22'] },
        { key: 'boss', color: '#c0392b', tagColors: ['#c0392b', '#8e44ad', '#f1c40f'] },
    ];

    return (
        <div className='wiki-body'>
            {enemies.map((e, i) => {
                const tags = t(`wiki.enemies.${e.key}.tags`, { returnObjects: true });
                return (
                    <div key={i} className='wiki-section' style={{ paddingBottom: '12px', borderBottom: i < enemies.length - 1 ? '1px dashed var(--line)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                            <div className='wiki-enemy' style={{ backgroundColor: e.color }} />
                            <strong style={{ fontSize: '1.1rem' }}>{t(`wiki.enemies.${e.key}.name`)}</strong>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {tags.map((tag, ti) => (
                                    <span className='wiki-badge tag' key={ti}>{tag}</span>
                                ))}
                            </div>
                        </div>
                        <div className='wiki-desc' style={{ marginBottom: '5px' }}>
                            {t(`wiki.enemies.${e.key}.desc`)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function WeaponsTab() {
    const { t } = useTranslation();

    const rangedKeys = [
        { key: 'single', color: '#bdc3c7' },
        { key: 'rifle', color: '#3498db' },
        { key: 'pierce', color: '#2ecc71' },
        { key: 'aoe', color: '#e67e22' },
        { key: 'chain', color: '#9b59b6' },
        { key: 'laser', color: '#e74c3c' },
        { key: 'smg', color: '#1abc9c' },
    ];

    const meleeKeys = [
        { key: 'single', color: '#bdc3c7' },
        { key: 'cleave', color: '#e67e22' },
        { key: 'frenzy', color: '#e74c3c' },
        { key: 'lunge', color: '#8e44ad' },
        { key: 'charge', color: '#f39c12' },
        { key: 'lifesteal', color: '#27ae60' },
    ];

    return (
        <div className='wiki-body'>
            <div className='wiki-section'>
                <div className='wiki-section-title'>{t('wiki.weapons.rangedTitle')}</div>
                {rangedKeys.map((e, i) => (
                    <div className='wiki-row' key={i}>
                        <span className='wiki-key' style={{ minWidth: '80px', borderLeft: `3px solid ${e.color}`, fontSize: '0.85rem' }}>
                            {t(`weaponEnchants.${e.key}`)}
                        </span>
                        <span className='wiki-desc'>{t(`wiki.weapons.ranged.${e.key}`)}</span>
                    </div>
                ))}
            </div>
            <div className='wiki-section'>
                <div className='wiki-section-title'>{t('wiki.weapons.meleeTitle')}</div>
                {meleeKeys.map((e, i) => (
                    <div className='wiki-row' key={i}>
                        <span className='wiki-key' style={{ minWidth: '80px', borderLeft: `3px solid ${e.color}`, fontSize: '0.85rem' }}>
                            {t(`weaponEnchants.${e.key}`)}
                        </span>
                        <span className='wiki-desc'>{t(`wiki.weapons.melee.${e.key}`)}</span>
                    </div>
                ))}
            </div>
            <div className='wiki-tip'>{t('wiki.weapons.tip')}</div>
        </div>
    );
}

function AugmentsTab() {
    const { t } = useTranslation();

    const rarities = [
        { key: 'common', color: '#bdc3c7' },
        { key: 'rare', color: '#3498db' },
        { key: 'epic', color: '#9b59b6' },
        { key: 'legendary', color: '#f1c40f' },
    ];

    const statKeys = [
        'maxHp', 'damage', 'range', 'moveSpeed', 'cooldown',
        'bulletSpeed', 'aoeRadius', 'pierce', 'laserWidth', 'chainRadius', 'lifesteal',
    ];

    return (
        <div className='wiki-body'>
            <div className='wiki-section'>
                <div className='wiki-section-title'>{t('wiki.augments.howTitle')}</div>
                <div className='wiki-desc'>{t('wiki.augments.howDesc')}</div>
            </div>

            <div className='wiki-section'>
                <div className='wiki-section-title'>{t('wiki.augments.raritiesTitle')}</div>
                {rarities.map((r, i) => {
                    const info = t(`wiki.augments.rarities.${r.key}`, { returnObjects: true });
                    return (
                        <div className='wiki-rarity-row' key={i}>
                            <div className='wiki-rarity-dot' style={{ backgroundColor: r.color }} />
                            <span style={{ fontWeight: 700, color: r.color, minWidth: '72px' }}>{info.name}</span>
                            <span className='wiki-key' style={{ fontSize: '0.8rem', minWidth: '44px' }}>{info.chance}</span>
                            <span className='wiki-desc'>{info.desc}</span>
                        </div>
                    );
                })}
            </div>

            <div className='wiki-section'>
                <div className='wiki-section-title'>{t('wiki.augments.statsTitle')}</div>
                {statKeys.map((key, i) => {
                    const [name, desc] = t(`wiki.augments.stats.${key}`, { returnObjects: true });
                    return (
                        <div className='wiki-row' key={i}>
                            <span className='wiki-key' style={{ minWidth: '90px', fontSize: '0.8rem' }}>{name}</span>
                            <span className='wiki-desc'>{desc}</span>
                        </div>
                    );
                })}
            </div>

            <div className='wiki-tip'>{t('wiki.augments.tip')}</div>
        </div>
    );
}

const TAB_IDS = ['controls', 'enemies', 'weapons', 'augments'];
const TAB_COMPONENTS = { controls: ControlsTab, enemies: EnemiesTab, weapons: WeaponsTab, augments: AugmentsTab };

export function WikiHelp() {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('controls');
    const containerRef = useRef(null);

    const toggleOpen = () => setIsOpen(prev => !prev);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const ActiveComponent = TAB_COMPONENTS[activeTab] ?? ControlsTab;

    return (
        <div className='wiki-container' ref={containerRef}>
            {isOpen && (
                <div className='modal wiki-modal'>
                    <div className='wiki-header'>
                        <div className='wiki-title'>{t('wiki.title')}</div>
                        <div className='wiki-tabs'>
                            {TAB_IDS.map(id => (
                                <button
                                    key={id}
                                    className={`wiki-tab ${id === activeTab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(id)}
                                >
                                    {t(`wiki.tabs.${id}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ActiveComponent />
                </div>
            )}
            <button
                className='button'
                onClick={toggleOpen}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
                {isOpen ? t('wiki.close') : t('wiki.button')}
            </button>
        </div>
    );
}