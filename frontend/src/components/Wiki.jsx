import { useState, useRef, useEffect } from 'react';
import '../assets/style/components/Wiki.css'

// ─── Tab content ──────────────────────────────────────────────────────────────

function ControlsTab() {
    return (
        <div className='wiki-body'>
            <div className='wiki-section'>
                <div className='wiki-section-title'>Movement</div>
                {[
                    [['W', 'A', 'S', 'D'], 'Move up / left / down / right'],
                    [['↑', '←', '↓', '→'], 'Arrow keys also work'],
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
                <div className='wiki-section-title'>Combat</div>
                {[
                    [['Mouse'], 'Aim - your character auto-faces the nearest enemy'],
                    [['LMB Hold'], 'Charge attack (Charge enchant only)'],
                ].map(([keys, desc], i) => (
                    <div className='wiki-row' key={i}>
                        <div style={{ display: 'flex', gap: '4px', minWidth: '90px' }}>
                            {keys.map(k => <span className='wiki-key' key={k}>{k}</span>)}
                        </div>
                        <span className='wiki-desc'>{desc}</span>
                    </div>
                ))}
                <div className='wiki-tip'>Attacks fire automatically - just stay in range of enemies.</div>
            </div>

            <div className='wiki-section'>
                <div className='wiki-section-title'>Game</div>
                {[
                    [['Esc'], 'Pause / Resume'],
                ].map(([keys, desc], i) => (
                    <div className='wiki-row' key={i}>
                        <div style={{ display: 'flex', gap: '4px', minWidth: '90px' }}>
                            {keys.map(k => <span className='wiki-key' key={k}>{k}</span>)}
                        </div>
                        <span className='wiki-desc'>{desc}</span>
                    </div>
                ))}
            </div>

            <div className='wiki-section'>
                <div className='wiki-section-title'>HUD legend</div>
                {[
                    ['Top-right', 'Score · Time survived · Current wave · Kill count'],
                    ['Bottom-left', 'Your HP bar, weapon type & stats'],
                    ['Bottom-right', 'Item slots (6 max) with cooldown bars'],
                    ['Top bar', 'Wave timer - fills up as time passes'],
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
    const enemies = [
        {
            color: '#e74c3c',
            name: 'Runner',
            tags: [{ label: 'fast', color: '#e74c3c' }, { label: 'fragile', color: '#7f8c8d' }],
            desc: 'Rushes directly at you. Low HP but high speed - dangerous in groups. Appears every wave from wave 1.',
            tip: 'Kite them in a wide circle. AoE or Pierce enchants shred packs.',
        },
        {
            color: '#8e44ad',
            name: 'Brute',
            tags: [{ label: 'slow', color: '#7f8c8d' }, { label: 'tanky', color: '#8e44ad' }, { label: 'heavy hit', color: '#c0392b' }],
            desc: 'Slow melee fighter with high HP and massive damage per swing. Appears from wave 4+.',
            tip: 'Never let more than one corner you. Chain or Laser weapons melt them fast.',
        },
        {
            color: '#e67e22',
            name: 'Shooter',
            tags: [{ label: 'ranged', color: '#2471a3' }, { label: 'kites', color: '#e67e22' }],
            desc: 'Maintains distance and fires projectiles. Tries to orbit you at ideal range. Appears from wave 5+.',
            tip: 'Close the gap fast - melee weapons deal with them much easier.',
        },
        {
            color: '#c0392b',
            name: 'Boss',
            tags: [{ label: 'wave 10, 20…', color: '#c0392b' }, { label: 'laser', color: '#8e44ad' }, { label: 'bonus reward', color: '#f1c40f' }],
            desc: 'Giant enemy with a long-range laser beam. Appears every 10 waves alongside a pack of Runners. Killing it grants a Boss Reward choice screen.',
            tip: 'Move perpendicular to its laser sweep. High range weapons let you chip from the edge of its beam angle.',
        },
    ];

    return (
        <div className='wiki-body'>
            {enemies.map((e, i) => (
                <div key={i} className='wiki-section' style={{ paddingBottom: '12px', borderBottom: i < enemies.length - 1 ? '1px dashed var(--line)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                        <div className='wiki-enemy' style={{ backgroundColor: e.color }} />
                        <strong style={{ fontSize: '1.1rem' }}>{e.name}</strong>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {e.tags.map(t => <span className='wiki-badge tag' key={t.label}>{t.label}</span>)}
                        </div>
                    </div>
                    <div className='wiki-desc' style={{ marginBottom: '5px' }}>{e.desc}</div>
                    {/*<div className='wiki-tip'>💡 {e.tip}</div>*/}
                </div>
            ))}
        </div>
    );
}

function WeaponsTab() {
    const enchants = [
        { type: 'range', name: 'Single', color: '#bdc3c7', desc: 'Standard single bullet. Reliable baseline - solid damage, decent range.' },
        { type: 'range', name: 'Rifle', color: '#3498db', desc: 'Fires a burst of bullets in quick succession. Great sustained DPS against tanky enemies.' },
        { type: 'range', name: 'Pierce', color: '#2ecc71', desc: 'Bullet travels through multiple enemies. Devastating against tight Runner packs.' },
        { type: 'range', name: 'AoE', color: '#e67e22', desc: 'Bullet explodes on impact. Damages all enemies in a radius - great for crowd control.' },
        { type: 'range', name: 'Chain', color: '#9b59b6', desc: 'Bullet bounces to nearby enemies after each hit. Excellent in dense waves.' },
        { type: 'range', name: 'Laser', color: '#e74c3c', desc: 'Charges briefly then fires an instant-hit beam. Massive damage, wide width. Hold position during charge.' },
        { type: 'range', name: 'SMG', color: '#1abc9c', desc: 'Very fast fire rate with bullet spread. Shreds anything that gets close, lower per-bullet damage.' },
        { type: 'melee', name: 'Single', color: '#bdc3c7', desc: 'Standard melee swing with a 90° arc. Simple and effective at close range.' },
        { type: 'melee', name: 'Cleave', color: '#e67e22', desc: 'Massive 180° arc hits everything in front of you. Perfect for Runner rushes.' },
        { type: 'melee', name: 'Frenzy', color: '#e74c3c', desc: 'Very fast attacks with a moderate arc. Synergizes well with Lifesteal.' },
        { type: 'melee', name: 'Lunge', color: '#8e44ad', desc: 'Narrow 25° arc but extremely high damage. Rewards precise positioning.' },
        { type: 'melee', name: 'Charge', color: '#f39c12', desc: 'Hold LMB to charge - damage and range scale with charge time. Massive burst potential.' },
        { type: 'melee', name: 'Lifesteal', color: '#27ae60', desc: 'Each hit heals you for a percentage of damage dealt. Makes staying in melee range safer.' },
    ];

    const ranged = enchants.filter(e => e.type === 'range');
    const melee = enchants.filter(e => e.type === 'melee');

    return (
        <div className='wiki-body'>
            <div className='wiki-section'>
                <div className='wiki-section-title'>🔫 Ranged</div>
                {ranged.map((e, i) => (
                    <div className='wiki-row' key={i}>
                        <span className='wiki-key' style={{ minWidth: '80px', borderLeft: `3px solid ${e.color}`, fontSize: '0.85rem' }}>{e.name}</span>
                        <span className='wiki-desc'>{e.desc}</span>
                    </div>
                ))}
            </div>
            <div className='wiki-section'>
                <div className='wiki-section-title'>⚔️ Melee</div>
                {melee.map((e, i) => (
                    <div className='wiki-row' key={i}>
                        <span className='wiki-key' style={{ minWidth: '80px', borderLeft: `3px solid ${e.color}`, fontSize: '0.85rem' }}>{e.name}</span>
                        <span className='wiki-desc'>{e.desc}</span>
                    </div>
                ))}
            </div>
            <div className='wiki-tip'>
                Enchants are unlocked at wave 20 and offered as a special reward. You can only have one enchant at a time.
            </div>
        </div>
    );
}

function AugmentsTab() {
    const rarities = [
        { name: 'Common', color: '#bdc3c7', chance: '75%', desc: 'Small bonuses, 5-15% improvements.' },
        { name: 'Rare', color: '#3498db', chance: '22.3%', desc: 'Solid upgrades, noticeable power spikes.' },
        { name: 'Epic', color: '#9b59b6', chance: '2.5%', desc: 'Large bonuses. Rare but impactful.' },
        { name: 'Legendary', color: '#f1c40f', chance: '0.16%', desc: 'Massive multipliers. Run-defining if you find one.' },
    ];

    const stats = [
        ['Max HP', 'Increases your maximum health. Also keeps current HP ratio.'],
        ['Damage', 'Multiplies weapon damage output.'],
        ['Range', 'Extends weapon effective range.'],
        ['Move Speed', 'Increases your movement speed. Very strong - mobility is survival.'],
        ['Cooldown', 'Reduces time between attacks. Negative % = faster attacks.'],
        ['Bullet Speed', 'How fast projectiles travel (ranged only).'],
        ['AoE Radius', 'Explosion size for AoE enchant.'],
        ['Pierce', 'Number of targets pierced (Pierce enchant).'],
        ['Laser Width', 'Beam thickness (Laser enchant).'],
        ['Chain Radius', 'How far chain lightning jumps (Chain enchant).'],
        ['Lifesteal', 'HP stolen per hit percentage (Lifesteal enchant).'],
    ];

    return (
        <div className='wiki-body'>
            <div className='wiki-section'>
                <div className='wiki-section-title'>How augments work</div>
                <div className='wiki-desc'>
                    After each wave you choose 1 of 3 random augments. Each has a rarity that determines the bonus magnitude - higher rarity = bigger % boost.
                    Boss reward screens always offer at least Rare quality.
                </div>
            </div>

            <div className='wiki-section'>
                <div className='wiki-section-title'>Rarities</div>
                {rarities.map((r, i) => (
                    <div className='wiki-rarity-row' key={i}>
                        <div className='wiki-rarity-dot' style={{ backgroundColor: r.color }} />
                        <span style={{ fontWeight: 700, color: r.color, minWidth: '72px' }}>{r.name}</span>
                        <span className='wiki-key' style={{ fontSize: '0.8rem', minWidth: '44px' }}>{r.chance}</span>
                        <span className='wiki-desc'>{r.desc}</span>
                    </div>
                ))}
            </div>

            <div className='wiki-section'>
                <div className='wiki-section-title'>Stat reference</div>
                {stats.map(([name, desc], i) => (
                    <div className='wiki-row' key={i}>
                        <span className='wiki-key' style={{ minWidth: '90px', fontSize: '0.8rem' }}>{name}</span>
                        <span className='wiki-desc'>{desc}</span>
                    </div>
                ))}
            </div>

            <div className='wiki-tip'>
                All bonuses are multiplicative - stacking the same stat compounds over time. A 15% Damage boost on top of existing upgrades is always 15% of your current value.
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS = [
    { id: 'controls', label: '🎮 Controls', Component: ControlsTab },
    { id: 'enemies', label: '👾 Enemies', Component: EnemiesTab },
    { id: 'weapons', label: '⚔️ Weapons', Component: WeaponsTab },
    { id: 'augments', label: '✦ Augments', Component: AugmentsTab },
];

export function WikiHelp() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('controls');
    const containerRef = useRef(null);

    const toggleOpen = () => setIsOpen(prev => !prev);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const ActiveComponent = TABS.find(t => t.id === activeTab)?.Component ?? ControlsTab;

    return (
        <div className='wiki-container' ref={containerRef}>
            {isOpen && (
                <div className='modal wiki-modal'>
                    <div className='wiki-header'>
                        <div className='wiki-title'>Wiki / Help</div>
                        <div className='wiki-tabs'>
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`wiki-tab ${tab.id === activeTab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
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
                {isOpen ? 'Close' : 'Wiki / Help'}
            </button>
        </div>
    );
}