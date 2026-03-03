import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEngine, GAME_STATE, WAVE_INTERVAL } from '../game/engine';
import '../assets/style/pages/Game.css';
import { formatDurationToHours } from '../utils/Utils';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useAuth } from '../context/AuthContext';
import { WEAPON_TYPE, WEAPON_ENCHANT } from '../game/weapon';
import { CHOICE_TYPE } from '../game/choice';

const MUTATION_ADD_RUN = gql`
  mutation AddRun($score: Int!, $duration: Int!, $wave: Int!, $kills: Int!) {
    addRun(score: $score, duration: $duration, wave: $wave, kills: $kills)
  }
`

const DEFAULT_HUD = {
  score: 0,
  elapsed: 0,
  wave: 1,
  player: undefined,
  gameState: GAME_STATE.RUNNING,
  waveState: {
    waveTitle: "",
    waveSubtitle: "",
    duration: 0,
  },
  choices: [],
  items: [],
};

function Game() {
  const { isLoggedIn, user } = useAuth();
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const navigate = useNavigate();
  const [addRun] = useMutation(MUTATION_ADD_RUN)

  // ref is used for the raw values and only setState at ~15fps
  // to avoid React re-rendering on every animation frame
  const hudRawRef = useRef(DEFAULT_HUD);
  const [hud, setHud] = useState(DEFAULT_HUD);

  // Called by the engine every frame
  const onHUDUpdate = useCallback(async (data) => {
    hudRawRef.current = data;

    if (data.gameState == "game_over") {
      try {
        await addRun({
          variables: {
            score: data.score,
            duration: Math.round(data.elapsed),
            wave: data.wave,
            kills: data.kills
          }
        })
      } catch (err) {
        console.error("Error while sending data", err)
      }
    }
  }, [addRun]);

  // Flush raw HUD values into React state at ~15fps
  useEffect(() => {
    const id = setInterval(() => setHud({ ...hudRawRef.current }), 66);
    return () => clearInterval(id);
  }, []);

  const onBack = () => {
    navigate('/');
  };

  const onPause = () => {
    engineRef.current.togglePause();
  }

  const onNewRun = () => {
    engineRef.current.restart();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Resize canvas to viewport
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create and start engine
    const engine = createEngine(canvas, onHUDUpdate);
    engineRef.current = engine;
    engine.start();

    const onKey = (e) => {
      if (e.key === 'Escape') engine.togglePause();
      if (e.key === '"') engine.restart();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      engine.stop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey);
    };
  }, [onHUDUpdate]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, background: '#f4f0e8' }}>
      {hudRawRef.current.gameState === GAME_STATE.GAME_OVER &&
        <div className='overlay game-over'>
          <span className='game-title'>GAME OVER</span>
          <div className='menu'>
            <button className='menu-btn' onClick={onNewRun}>Start a new run</button>
            <button className='menu-btn' onClick={onBack}>← menu</button>
          </div>
        </div>
      }
      {hudRawRef.current.gameState === GAME_STATE.PAUSED &&
        <div className='overlay pause'>
          <span className='game-title'>GAME PAUSED</span>
          <div className='menu'>
            <button className='menu-btn' onClick={onPause}>Return to game</button>
            <button className='menu-btn' onClick={onBack}>← menu</button>
          </div>
        </div>
      }
      {hudRawRef.current.gameState === GAME_STATE.CHOICE && (
        <div className='overlay choice'>
          <span className='choice-title'>CHOOSE YOUR AUGMENT</span>
          <div className='choice-list'>
            {hudRawRef.current.choices.map((choice) => (
              <div
                className='choice-card'
                onClick={() => { choice.func(choice.arg, choice.type === CHOICE_TYPE.AUGMENT ? choice.bonus : choice.type === CHOICE_TYPE.WEAPON ? choice.wpn : choice.enchant); engineRef.current.madeChoice() }}
                key={choice.id}
                style={{ borderColor: choice.rarityColor }}
              >
                <span
                  className="choice-rarity"
                  style={{ backgroundColor: choice.rarityColor }}
                >
                  {choice.rarityName}
                </span>

                <img className='choice-img' src={choice.icon || "temp.png"} alt="icon" />
                <span className='choice-attr'>{choice.attr}</span>

                {choice.type === CHOICE_TYPE.AUGMENT &&
                  <div className="choice-stats-container">
                    <span className="choice-curr">current: {choice.curr}</span>
                    <span className="choice-bonus">
                      {choice.bonus > 0 ? '+' : ''}{choice.bonus}%
                    </span>
                    <span className="choice-new">➔ {choice.new}</span>
                  </div>
                }
                {choice.type === CHOICE_TYPE.WEAPON &&
                  <div className="choice-stats-container weapon">
                    {choice.wpn.props.map(prop => (
                      <div className='choice-wpn-attr' key={prop}>
                        <span className='choice-wpn-attr-title'>{prop}</span>
                        <span className='choice-wpn-attr-value'>{choice.wpn[prop]}</span>
                      </div>
                    ))}
                  </div>
                }
                {choice.type === CHOICE_TYPE.ENCHANT &&
                  <>
                    <div className="choice-stats-container enchant">
                      {choice.enchant.props.map(prop => (
                        <div className='choice-enchant-attr' key={prop}>
                          <span className='choice-enchant-attr-title'>{prop}</span>
                          <span className='choice-enchant-attr-value'>{choice.enchant[prop]}</span>
                        </div>
                      ))}
                    </div>
                    <div className="choice-stats-container enchant">
                      {choice.enchant.bonusProps.map(prop => {
                        const value = choice.enchant[prop];
                        const diff = value - 100;
                        const isBonus = prop === 'cooldown' ? diff < 0 : diff > 0;
                        const statusClass = diff === 0 ? '' : (isBonus ? 'bonus' : 'malus');

                        return (
                          <div className='choice-enchant-attr' key={prop}>
                            <span className='choice-enchant-attr-title'>{prop}</span>
                            <span className={`choice-enchant-attr-value ${statusClass}`}>
                              {diff >= 0 && '+'}{diff}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                }
              </div>
            ))}
          </div>
        </div>
      )}
      {/* score / time / wave / kills */}
      {hudRawRef.current.gameState === GAME_STATE.RUNNING && (
        <div className="hud">
          <div className="hud-stat">
            <span className="hud-stat-label">score</span>
            <span className="hud-stat-value">{hudRawRef.current.score}</span>
          </div>
          <div className="hud-stat">
            <span className="hud-stat-label">time</span>
            <span className="hud-stat-value">{formatDurationToHours(hudRawRef.current.elapsed)}</span>
          </div>
          <div className="hud-stat">
            <span className="hud-stat-label">wave</span>
            <span className="hud-stat-value">{hudRawRef.current.wave}</span>
          </div>
          <div className="hud-stat">
            <span className="hud-stat-label">kills</span>
            <span className="hud-stat-value">{hudRawRef.current.kills}</span>
          </div>
        </div>
      )}

      {/* Player stats */}
      {hudRawRef.current.gameState === GAME_STATE.RUNNING && hudRawRef.current.player && (() => {
        const p = hudRawRef.current.player;
        const w = p.weapon;
        const hpPct = p.maxHp > 0 ? Math.round((p.hp / p.maxHp) * 100) : 0;
        const hpValCls = hpPct <= 25 ? 'pc-hp-value hp-low' : hpPct <= 50 ? 'pc-hp-value hp-mid' : 'pc-hp-value';
        const hpBarCls = hpPct <= 25 ? 'hp-bar-fill hp-low' : hpPct <= 50 ? 'hp-bar-fill hp-mid' : 'hp-bar-fill';
        return (
          <div className="player-card">
            <span className="pc-identity">{isLoggedIn ? user?.username : 'Guest'}</span>

            <div className="pc-hp-row">
              <span className={hpValCls}>{Math.round(p.hp)}</span>
              <span className="pc-hp-max">/ {p.maxHp}</span>
            </div>
            <div className="hp-bar-track">
              <div className={hpBarCls} style={{ width: `${hpPct}%` }} />
            </div>

            {w && (
              <>
                <div className="pc-weapon-row">
                  <span className="pc-weapon-type">{w.type}</span>
                  {w.enchant && <span className="pc-weapon-enchant">{w.enchant}</span>}
                </div>
                <div className="pc-weapon-stats">
                  <span className="pw-stat">
                    <span className="pw-label">cd</span>
                    <span className="pw-value">{w.cooldownTime}</span>
                  </span>
                  <span className="pw-stat">
                    <span className="pw-label">dmg</span>
                    <span className="pw-value">{Math.round(w.damage)}</span>
                  </span>
                  <span className="pw-stat">
                    <span className="pw-label">rng</span>
                    <span className="pw-value">{Math.round(w.range)}</span>
                  </span>

                  {w.type === WEAPON_TYPE.MELEE && w.angle != null && (
                    <span className="pw-stat">
                      <span className="pw-label">arc</span>
                      <span className="pw-value">{w.angle}°</span>
                    </span>
                  )}
                  {w.enchant === WEAPON_ENCHANT.AOE && (
                    <>
                      <span className="pw-stat">
                        <span className="pw-label">aoe</span>
                        <span className="pw-value">{Math.round(w.aoeDamage ?? 0)}</span>
                      </span>
                      <span className="pw-stat">
                        <span className="pw-label">r</span>
                        <span className="pw-value">{Math.round(w.aoeRadius ?? 0)}</span>
                      </span>
                    </>
                  )}
                  {w.enchant === WEAPON_ENCHANT.PIERCE && w.pierce != null && (
                    <span className="pw-stat">
                      <span className="pw-label">pierce</span>
                      <span className="pw-value">{w.pierce}</span>
                    </span>
                  )}
                  {w.enchant === WEAPON_ENCHANT.RIFLE && w.rifle != null && (
                    <span className="pw-stat">
                      <span className="pw-label">rifle</span>
                      <span className="pw-value">{w.rifle}</span>
                    </span>
                  )}
                  {w.enchant === WEAPON_ENCHANT.TRANSFER && (
                    <>
                      <span className="pw-stat">
                        <span className="pw-label">chain</span>
                        <span className="pw-value">{Math.round(w.transferRadius ?? 0)}</span>
                      </span>
                      <span className="pw-stat">
                        <span className="pw-label">fall</span>
                        <span className="pw-value">-{w.transferDamageReduction ?? 0}%</span>
                      </span>
                    </>
                  )}
                </div>
              </>
            )}

            <span className="pc-stat">
              <span className="pc-label">MS</span>
              <span className="pc-value">{Math.round(p.speed)}</span>
            </span>
          </div>
        );
      })()}

      {/* Items 3×2 grid */}
      {hudRawRef.current.gameState === GAME_STATE.RUNNING && (() => {
        const items = hudRawRef.current.player?.items ?? [];
        const slots = Array.from({ length: 6 }, (_, i) => items[i] ?? null);
        return (
          <div className="items-grid">
            {slots.map((item, i) => {
              if (!item) return <div key={i} className="item-slot empty" />;
              const cdPct = item.cooldownTime
                ? Math.round((1 - item.cooldown / item.cooldownTime) * 100)
                : 100;
              const isReady = !item.cooldownTime || item.cooldown <= 0;
              return (
                <div key={i} className="item-slot">
                  <img src={item.icon || 'temp.png'} alt={item.name} />
                  {item.cooldownTime && (
                    <>
                      <span className="item-slot-cd">
                        {item.cooldown > 0 ? Number(item.cooldown).toFixed(1) : ''}
                      </span>
                      <div
                        className={`item-slot-bar ${isReady ? 'ready' : ''}`}
                        style={{ width: `${cdPct}%` }}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
      {
        <div className="wave-time">
          <div className='wave-remaining-time' style={{ width: `${hudRawRef.current.waveTimer / WAVE_INTERVAL * 100}%` }}></div>
        </div>
      }
      {hudRawRef.current.gameState === GAME_STATE.RUNNING && hudRawRef.current.waveState && hudRawRef.current.waveState.duration > 0 &&
        <div className={`wave-info ${hudRawRef.current.waveState.duration < 0.5 ? 'exit' : ''}`}>
          <span className='wave-title'>{hudRawRef.current.waveState.waveTitle}</span>
          <span className='wave-subtitle'>{hudRawRef.current.waveState.waveSubtitle}</span>
        </div>
      }
      <canvas ref={canvasRef} className="game-canvas"></canvas>
    </div>
  );
}

export default Game;