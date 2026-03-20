import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEngine, GAME_STATE, WAVE_INTERVAL, CLASS_DEFS } from '../game/engine';
import '../assets/style/pages/Game.css';
import { formatDurationToHours } from '../utils/Utils';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useAuth } from '../context/AuthContext';
import { WEAPON_TYPE, WEAPON_ENCHANT } from '../game/weapon';
import { CHOICE_TYPE } from '../game/choice';
import NavBar from '../components/NavBar';
import { PatchNotes } from '../components/PatchNotes';
import { useTranslation } from 'react-i18next';
import MobileControls from '../components/MobileControls';

const MUTATION_ADD_RUN = gql`
  mutation AddRun($score: Int!, $duration: Int!, $wave: Int!, $kills: Int!) {
    addRun(score: $score, duration: $duration, wave: $wave, kills: $kills)
  }
`;

const DEFAULT_HUD = {
  score: 0, elapsed: 0, wave: 1,
  player: undefined,
  gameState: GAME_STATE.CLASS_SELECT,
  waveMsg: { waveNumber: 0, duration: 0 },
  choices: [],
  items: [],
  rerollsLeft: 2,
  isEngineer: false,
  drones: null,
  playerClass: null,
};

function ClassSelectOverlay({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  const { t } = useTranslation();

  return (
    <div className="overlay">
      <span className="game-title" style={{ fontSize: 'clamp(36px, 9vw, 96px)' }}>
        Choose your class
      </span>

      <div style={{
        display: 'flex',
        gap: 'clamp(10px, 2vw, 24px)',
        justifyContent: 'center',
        flexWrap: 'wrap',
        padding: '0 clamp(12px, 3vw, 32px)',
        marginTop: 'clamp(4px, 1vh, 12px)',
      }}>
        {CLASS_DEFS.map(cls => {
          const isHovered = hovered === cls.id;
          return (
            <div
              key={cls.id}
              onClick={() => onSelect(cls.id)}
              onMouseEnter={() => setHovered(cls.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: isHovered ? '#2a2318' : 'rgba(244,240,232,0.95)',
                border: `3px solid ${cls.color}`,
                color: isHovered ? '#f4f0e8' : '#2a2318',
                padding: 'clamp(14px, 2.5vh, 22px) clamp(16px, 2.5vw, 28px)',
                width: 'clamp(160px, 22vw, 220px)',
                cursor: 'pointer',
                boxShadow: isHovered
                  ? `6px 6px 0 ${cls.color}55`
                  : `4px 4px 0 rgba(42,35,24,0.12)`,
                transform: isHovered ? 'translateY(-6px)' : 'none',
                transition: 'all 0.12s',
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(6px, 1vh, 10px)',
                fontFamily: "'Patrick Hand', cursive",
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'clamp(22px, 4vw, 32px)', lineHeight: 1 }}>{cls.icon}</span>
                <span style={{ fontSize: 'clamp(20px, 3.5vw, 28px)', fontWeight: 700, color: cls.color }}>
                  {cls.label}
                </span>
              </div>

              <p style={{
                fontSize: 'clamp(12px, 1.8vw, 15px)', lineHeight: 1.35,
                color: isHovered ? 'rgba(244,240,232,0.75)' : '#5a5040', margin: 0,
              }}>
                {cls.description}
              </p>

              <div style={{
                borderTop: `1.5px dashed ${isHovered ? 'rgba(244,240,232,0.2)' : '#c8bfad'}`,
                paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 3,
              }}>
                {cls.stats.map(s => (
                  <div key={s.key} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 'clamp(11px, 1.6vw, 14px)',
                  }}>
                    <span style={{ color: isHovered ? 'rgba(244,240,232,0.55)' : '#a89880' }}>{s.key}</span>
                    <span style={{ fontWeight: 700 }}>{s.value}</span>
                  </div>
                ))}
              </div>

              <div style={{
                fontSize: 'clamp(10px, 1.4vw, 12px)',
                color: cls.color + 'cc', fontStyle: 'italic', marginTop: 2,
              }}>
                {cls.startWeaponHint}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Game() {
  const { t } = useTranslation();
  const { isLoggedIn, user } = useAuth();
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const navigate = useNavigate();
  const [addRun] = useMutation(MUTATION_ADD_RUN);

  const hudRawRef = useRef(DEFAULT_HUD);
  const [, setHud] = useState(DEFAULT_HUD);

  const onHUDUpdate = useCallback(async (data) => {
    hudRawRef.current = { ...hudRawRef.current, ...data };
    if (data.gameState === 'game_over') {
      try {
        await addRun({
          variables: {
            score: data.score,
            duration: Math.round(data.elapsed),
            wave: data.wave,
            kills: data.kills,
          },
        });
      } catch (err) {
        console.error('Error while sending run data', err);
      }
    }
  }, [addRun]);

  useEffect(() => {
    const id = setInterval(() => setHud({ ...hudRawRef.current }), 66);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const engine = createEngine(canvas, onHUDUpdate);
    engineRef.current = engine;
    engine.start();

    const onKey = (e) => {
      if (e.key === 'Escape') engine.togglePause();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      engine.stop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey);
    };
  }, [onHUDUpdate]);

  const tAttr = (attr) => t(`game.augmentAttrs.${attr}`, { defaultValue: attr });
  const tWeaponLabel = (wpn) => {
    const type = t(`weaponTypes.${wpn.type}`, { defaultValue: wpn.type });
    if (!wpn.enchant || wpn.enchant === 'single') return type;
    return `${type} · ${t(`weaponEnchants.${wpn.enchant}`, { defaultValue: wpn.enchant })}`;
  };
  const tEnchant = (name) => t(`weaponEnchants.${name}`, { defaultValue: name });
  const tRarity = (name) => t(`game.rarities.${name}`, { defaultValue: name });
  const tProp = (prop) => t(`game.choiceProps.${prop}`, { defaultValue: prop });

  const ENGINEER_ATTR_LABELS = {
    maxHp: 'Engineer HP',
    moveSpeed: 'Move Speed',
    droneHp: 'All Drone HP',
    rangeDamage: '🔫 Damage',
    rangeFireRate: '🔫 Fire Rate',
    rangeRange: '🔫 Range',
    meleeDamage: '⚔️ Damage',
    meleeFireRate: '⚔️ Fire Rate',
    meleeRange: '⚔️ Range',
  };
  const tEngAttr = (attr) => ENGINEER_ATTR_LABELS[attr] ?? attr;

  const hud = hudRawRef.current;

  const handleChoiceClick = (choice) => {
    switch (choice.type) {
      case CHOICE_TYPE.AUGMENT:
        choice.func(choice.arg, choice.bonus);
        break;
      case CHOICE_TYPE.WEAPON:
        choice.func(choice.arg, choice.wpn);
        break;
      case CHOICE_TYPE.ENCHANT:
        choice.func(choice.arg, choice.enchant);
        break;
      case CHOICE_TYPE.BOSS_REWARD:
        choice.func(choice.arg, choice.bonus);
        break;
      case CHOICE_TYPE.ENGINEER_UPGRADE:
        choice.func(choice.bonus);
        break;
      case CHOICE_TYPE.ENGINEER_ENCHANT:
        choice.func(hud.player, { enchant: choice.enchant, droneType: choice.droneType });
        break;
      default:
        if (choice.func) choice.func(choice.arg, choice.bonus ?? choice.wpn ?? choice.enchant);
    }
    engineRef.current.madeChoice();
  };

  return (
    <>
      {hud.gameState === GAME_STATE.RUNNING && <MobileControls />}

      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, background: '#f4f0e8' }}>

        {/* ── Class selection ── */}
        {hud.gameState === GAME_STATE.CLASS_SELECT && (
          <ClassSelectOverlay onSelect={(id) => engineRef.current?.selectClass(id)} />
        )}

        {/* ── Game Over ── */}
        {hud.gameState === GAME_STATE.GAME_OVER && (
          <div className="overlay game-over">
            <span className="game-title">{t('game.gameOver')}</span>
            <div className="menu">
              <button className="menu-btn" onClick={() => engineRef.current.restart()}>
                {t('game.newRun')}
              </button>
              <button className="menu-btn" onClick={() => navigate('/')}>
                {t('game.backToMenu')}
              </button>
            </div>
          </div>
        )}

        {/* ── Paused ── */}
        {hud.gameState === GAME_STATE.PAUSED && (
          <div className="overlay pause">
            <span className="game-title">{t('game.gamePaused')}</span>
            <div className="menu">
              <button className="menu-btn" onClick={() => engineRef.current.togglePause()}>
                {t('game.returnToGame')}
              </button>
              <button className="menu-btn" onClick={() => navigate('/')}>
                {t('game.backToMenu')}
              </button>
            </div>
          </div>
        )}

        {/* ── Choice screen ── */}
        {hud.gameState === GAME_STATE.CHOICE && (
          <div className="overlay choice">
            <span className="choice-title">
              { t('game.chooseAugment') }
            </span>
            <div className="choice-list">
              {hud.choices.map((choice) => (
                <div
                  className="choice-card"
                  key={choice.id}
                  style={{ borderColor: choice.rarityColor }}
                  onClick={() => handleChoiceClick(choice)}
                >
                  <span className="choice-rarity" style={{ backgroundColor: choice.rarityColor }}>
                    {tRarity(choice.rarityName)}
                  </span>
                  <img className="choice-img" src={choice.icon || 'temp.png'} alt="icon" />

                  {/* Standard augment */}
                  {(choice.type === CHOICE_TYPE.AUGMENT || choice.type === CHOICE_TYPE.BOSS_REWARD) && (
                    <>
                      <span className="choice-attr">{tAttr(choice.attr)}</span>
                      <div className="choice-stats-container">
                        <span className="choice-curr">{t('game.choice.current', { value: choice.curr })}</span>
                        <span className="choice-bonus">{choice.bonus > 0 ? '+' : ''}{choice.bonus}%</span>
                        <span className="choice-new">{t('game.choice.newValue', { value: choice.new })}</span>
                      </div>
                    </>
                  )}

                  {/* Weapon pick */}
                  {choice.type === CHOICE_TYPE.WEAPON && (
                    <>
                      <span className="choice-attr">{tWeaponLabel(choice.wpn)}</span>
                      <div className="choice-stats-container weapon">
                        {choice.wpn.props.map((prop) => (
                          <div className="choice-wpn-attr" key={prop}>
                            <span className="choice-wpn-attr-title">{tProp(prop)}</span>
                            <span className="choice-wpn-attr-value">{choice.wpn[prop]}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Standard enchant */}
                  {choice.type === CHOICE_TYPE.ENCHANT && (
                    <>
                      <span className="choice-attr">{tEnchant(choice.attr)}</span>
                      <div className="choice-stats-container enchant">
                        {choice.enchant.props.map((prop) => (
                          <div className="choice-enchant-attr" key={prop}>
                            <span className="choice-enchant-attr-title">{tProp(prop)}</span>
                            <span className="choice-enchant-attr-value">{choice.enchant[prop]}</span>
                          </div>
                        ))}
                      </div>
                      <div className="choice-stats-container enchant">
                        {choice.enchant.bonusProps.map((prop) => {
                          const value = choice.enchant[prop];
                          const diff = value - 100;
                          const isBonus = prop === 'cooldown' ? diff < 0 : diff > 0;
                          const cls = diff === 0 ? '' : isBonus ? 'bonus' : 'malus';
                          return (
                            <div className="choice-enchant-attr" key={prop}>
                              <span className="choice-enchant-attr-title">{tProp(prop)}</span>
                              <span className={`choice-enchant-attr-value ${cls}`}>
                                {diff >= 0 && '+'}{diff}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* ── Engineer upgrade ── */}
                  {choice.type === CHOICE_TYPE.ENGINEER_UPGRADE && (
                    <>
                      <span className="choice-attr">{tEngAttr(choice.attr)}</span>
                      <div className="choice-stats-container">
                        <span className="choice-curr">{t('game.choice.current', {
                          value:
                            typeof choice.curr === 'number' ? choice.curr.toFixed(choice.curr % 1 === 0 ? 0 : 2) : choice.curr
                        })}</span>
                        <span className="choice-bonus">{choice.bonus > 0 ? '+' : ''}{choice.bonus}%</span>
                        <span className="choice-new">{t('game.choice.newValue', {
                          value:
                            typeof choice.new === 'number' ? choice.new.toFixed(choice.new % 1 === 0 ? 0 : 2) : choice.new
                        })}</span>
                      </div>
                    </>
                  )}

                  {/* ── Engineer enchant ── */}
                  {choice.type === CHOICE_TYPE.ENGINEER_ENCHANT && (
                    <>
                      {/* Drone type label */}
                      <span style={{
                        fontFamily: "'Patrick Hand', cursive",
                        fontSize: 'clamp(11px, 1.8vw, 14px)',
                        color: choice.droneColor,
                        fontWeight: 700,
                        marginBottom: 2,
                      }}>
                        {choice.droneTypeLabel}
                      </span>
                      <span className="choice-attr">{tEnchant(choice.enchant?.name)}</span>
                      {/* Enchant-specific props */}
                      {choice.enchant?.props?.length > 0 && (
                        <div className="choice-stats-container enchant">
                          {choice.enchant.props.map((prop) => (
                            <div className="choice-enchant-attr" key={prop}>
                              <span className="choice-enchant-attr-title">{tProp(prop)}</span>
                              <span className="choice-enchant-attr-value">{choice.enchant[prop]}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Bonus/malus props */}
                      {choice.enchant?.bonusProps?.length > 0 && (
                        <div className="choice-stats-container enchant">
                          {choice.enchant.bonusProps.map((prop) => {
                            const value = choice.enchant[prop];
                            const diff = value - 100;
                            const isBonus = prop === 'cooldown' ? diff < 0 : diff > 0;
                            const cls = diff === 0 ? '' : isBonus ? 'bonus' : 'malus';
                            return (
                              <div className="choice-enchant-attr" key={prop}>
                                <span className="choice-enchant-attr-title">{tProp(prop)}</span>
                                <span className={`choice-enchant-attr-value ${cls}`}>
                                  {diff >= 0 && '+'}{diff}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {hud.rerollsLeft > 0 && hud.wave > 0 && (
              <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <button className="menu-btn" onClick={() => engineRef.current.rerollChoice()}>
                  Reroll Choices ({hud.rerollsLeft} left)
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── HUD (running only) ── */}
        {hud.gameState === GAME_STATE.RUNNING && (
          <div className="hud">
            {[
              ['game.hud.score', hud.score],
              ['game.hud.time', formatDurationToHours(hud.elapsed)],
              ['game.hud.wave', hud.wave],
              ['game.hud.kills', hud.kills],
            ].map(([labelKey, value]) => (
              <div className="hud-stat" key={labelKey}>
                <span className="hud-stat-label">{t(labelKey)}</span>
                <span className="hud-stat-value">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Player card ── */}
        {hud.gameState === GAME_STATE.RUNNING && hud.player && (() => {
          const p = hud.player;
          const w = p.weapon;
          const hpPct = p.maxHp > 0 ? Math.round((p.hp / p.maxHp) * 100) : 0;
          const hpCls = hpPct <= 25 ? 'pc-hp-value hp-low' : hpPct <= 50 ? 'pc-hp-value hp-mid' : 'pc-hp-value';
          const barCls = hpPct <= 25 ? 'hp-bar-fill hp-low' : hpPct <= 50 ? 'hp-bar-fill hp-mid' : 'hp-bar-fill';

          return (
            <div className="player-card">
              <span className="pc-identity">
                {isLoggedIn ? user?.username : t('game.playerCard.guest')}
                {hud.playerClass && (
                  <span style={{ opacity: 0.5, fontSize: '0.8em', marginLeft: 6 }}>
                    {CLASS_DEFS.find(c => c.id === hud.playerClass)?.icon}
                  </span>
                )}
              </span>

              <div className="pc-hp-row">
                <span className={hpCls}>{Math.round(p.hp)}</span>
                <span className="pc-hp-max">/ {p.maxHp}</span>
              </div>
              <div className="hp-bar-track">
                <div className={barCls} style={{ width: `${hpPct}%` }} />
              </div>

              {w && (
                <>
                  <div className="pc-weapon-row">
                    <span className="pc-weapon-type">
                      {t(`weaponTypes.${w.type}`, { defaultValue: w.type })}
                    </span>
                    {w.enchant && (
                      <span className="pc-weapon-enchant">
                        {t(`weaponEnchants.${w.enchant}`, { defaultValue: w.enchant })}
                      </span>
                    )}
                  </div>
                  <div className="pc-weapon-stats">
                    <span className="pw-stat">
                      <span className="pw-label">{t('game.playerCard.cd')}</span>
                      <span className="pw-value">{w.cooldown}</span>
                    </span>
                    <span className="pw-stat">
                      <span className="pw-label">{t('game.playerCard.dmg')}</span>
                      <span className="pw-value">{Math.round(w.damage)}</span>
                    </span>
                    <span className="pw-stat">
                      <span className="pw-label">{t('game.playerCard.rng')}</span>
                      <span className="pw-value">{Math.round(w.range)}</span>
                    </span>
                    {w.type === WEAPON_TYPE.MELEE && w.angle != null && (
                      <span className="pw-stat">
                        <span className="pw-label">{t('game.playerCard.arc')}</span>
                        <span className="pw-value">{w.angle}°</span>
                      </span>
                    )}
                    {w.enchant === WEAPON_ENCHANT.AOE && (
                      <>
                        <span className="pw-stat">
                          <span className="pw-label">{t('game.playerCard.aoe')}</span>
                          <span className="pw-value">{Math.round(w.aoeDamage ?? 0)}</span>
                        </span>
                        <span className="pw-stat">
                          <span className="pw-label">{t('game.playerCard.radius')}</span>
                          <span className="pw-value">{Math.round(w.aoeRadius ?? 0)}</span>
                        </span>
                      </>
                    )}
                    {w.enchant === WEAPON_ENCHANT.PIERCE && w.pierce != null && (
                      <span className="pw-stat">
                        <span className="pw-label">{t('game.playerCard.pierce')}</span>
                        <span className="pw-value">{w.pierce}</span>
                      </span>
                    )}
                    {w.enchant === WEAPON_ENCHANT.RIFLE && w.rifle != null && (
                      <span className="pw-stat">
                        <span className="pw-label">{t('game.playerCard.rifle')}</span>
                        <span className="pw-value">{w.rifle}</span>
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Engineer summary instead of weapon stats */}
              {hud.isEngineer && (
                <div style={{ fontSize: 'clamp(8px, 1.3vw, 11px)', color: 'rgba(42,35,24,0.45)', marginTop: 3 }}>
                  {hud.drones?.filter(d => d.state === 'deployed').length ?? 0} deployed ·{' '}
                  {hud.drones?.filter(d => d.state === 'wrecked').length ?? 0} wrecked
                </div>
              )}

              <span className="pc-stat">
                <span className="pc-label">{t('game.playerCard.ms')}</span>
                <span className="pc-value">{Math.round(p.speed)}</span>
              </span>
            </div>
          );
        })()}

        {/* ── Items grid ── */}
        {hud.gameState === GAME_STATE.RUNNING && (() => {
          const items = hud.player?.items ?? [];
          const slots = Array.from({ length: 6 }, (_, i) => items[i] ?? null);
          return (
            <div className="items-grid">
              {slots.map((item, i) => {
                if (!item) return <div key={i} className="item-slot empty" />;
                const cdPct = item.cooldown ? Math.round((1 - item.cooldownTime / item.cooldown) * 100) : 100;
                const isReady = !item.cooldown || item.cooldownTime <= 0;
                return (
                  <div key={i} className="item-slot">
                    <img src={item.icon || 'temp.png'} alt={item.name} />
                    {item.cooldown && (
                      <>
                        <span className="item-slot-cd">
                          {item.cooldownTime > 0 ? Number(item.cooldownTime).toFixed(1) : ''}
                        </span>
                        <div className={`item-slot-bar ${isReady ? 'ready' : ''}`} style={{ width: `${cdPct}%` }} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* ── Drone status bar (engineer only) ── */}
        {hud.gameState === GAME_STATE.RUNNING && hud.isEngineer && hud.drones && (
          <div style={{
            position: 'fixed',
            bottom: 'clamp(8px, 2vh, 20px)',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 6,
            fontFamily: "'Patrick Hand', cursive",
            pointerEvents: 'none',
            zIndex: 201,
          }}>
            {hud.drones.map((drone, i) => {
              const stateColor = {
                stash: 'rgba(42,35,24,0.2)',
                orbiting: '#2471a3',
                deployed: '#27ae60',
                wrecked: '#c0392b',
                recalling: '#e67e22',
              }[drone.state] ?? '#ccc';
              const typeIcon = drone.weaponType === 'melee' ? '⚔' : '🔫';
              const hpPct = drone.maxHp > 0 ? drone.hp / drone.maxHp : 0;

              return (
                <div key={i} style={{
                  width: 50,
                  background: 'rgba(230,224,210,0.82)',
                  border: `2px solid ${stateColor}`,
                  borderRadius: 3,
                  padding: '4px 5px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  opacity: drone.state === 'stash' ? 0.3 : 1,
                  transition: 'opacity 0.2s, border-color 0.2s',
                }}>
                  <span style={{ fontSize: 14, lineHeight: 1 }}>{typeIcon}</span>
                  <span style={{
                    fontSize: 8, textTransform: 'uppercase',
                    color: stateColor, letterSpacing: '0.3px', lineHeight: 1,
                  }}>
                    {drone.state}
                  </span>
                  {drone.state !== 'stash' && (
                    <div style={{ width: '100%', height: 3, background: 'rgba(42,35,24,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.round(hpPct * 100)}%`, height: '100%',
                        background: drone.state === 'wrecked' ? '#c0392b' : hpPct > 0.5 ? stateColor : '#e67e22',
                        transition: 'width 0.1s',
                      }} />
                    </div>
                  )}
                  {drone.state === 'wrecked' && drone.repairProgress > 0 && (
                    <div style={{ width: '100%', height: 3, background: 'rgba(0,0,0,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.round(drone.repairProgress * 100)}%`,
                        height: '100%', background: '#27ae60',
                      }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Engineer input hints ── */}
        {hud.gameState === GAME_STATE.RUNNING && hud.isEngineer && (
          <div style={{
            position: 'fixed', top: 18, left: 'clamp(8px, 2vw, 16px)',
            fontFamily: "'Patrick Hand', cursive", fontSize: 'clamp(9px, 1.4vw, 12px)',
            color: 'rgba(42,35,24,0.4)', pointerEvents: 'none', zIndex: 201, lineHeight: 1.6,
          }}>
            <div>Tab — select drone</div>
            <div>LMB — deploy selected</div>
            <div>RMB — recall drone</div>
          </div>
        )}

        {/* ── Wave timer bar ── */}
        <div className="wave-time">
          <div
            className="wave-remaining-time"
            style={{ width: `${(hud.waveTimer / WAVE_INTERVAL) * 100}%` }}
          />
        </div>

        {/* ── Wave announcement ── */}
        {hud.gameState === GAME_STATE.RUNNING && hud.waveMsg?.duration > 0 && (
          <div className={`wave-info ${hud.waveMsg.duration < 0.5 ? 'exit' : ''}`}>
            <span className="wave-title">
              {t('game.wave', { number: hud.waveMsg.waveNumber })}
            </span>
          </div>
        )}

        <canvas ref={canvasRef} className="game-canvas" />
      </div>
    </>
  );
}

export default Game;