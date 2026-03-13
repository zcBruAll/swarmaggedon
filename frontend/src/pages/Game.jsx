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
import NavBar from '../components/NavBar';
import { PatchNotes } from '../components/PatchNotes';
import { useTranslation } from 'react-i18next';

const MUTATION_ADD_RUN = gql`
  mutation AddRun($score: Int!, $duration: Int!, $wave: Int!, $kills: Int!) {
    addRun(score: $score, duration: $duration, wave: $wave, kills: $kills)
  }
`;

const DEFAULT_HUD = {
  score: 0, elapsed: 0, wave: 1,
  player: undefined,
  gameState: GAME_STATE.RUNNING,
  waveMsg: { waveNumber: 0, duration: 0 },
  choices: [],
  items: [],
  rerollsLeft: 2,
};

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
    hudRawRef.current = data;
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
        console.error('Error while sending data', err);
      }
    }
  }, [addRun]);

  // Flush raw HUD values into React state at ~15fps
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
      if (e.key === '"') engine.restart();
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
    const enchant = t(`weaponEnchants.${wpn.enchant}`, { defaultValue: wpn.enchant });
    return `${type} · ${enchant}`;
  };

  const tEnchant = (name) => t(`weaponEnchants.${name}`, { defaultValue: name });

  const tRarity = (name) => t(`game.rarities.${name}`, { defaultValue: name });

  const tProp = (prop) => t(`game.choiceProps.${prop}`, { defaultValue: prop });

  return (
    <>
      <NavBar />
      <PatchNotes />
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, background: '#f4f0e8' }}>

        {/* ── Game Over ── */}
        {hudRawRef.current.gameState === GAME_STATE.GAME_OVER && (
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
        {hudRawRef.current.gameState === GAME_STATE.PAUSED && (
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
        {hudRawRef.current.gameState === GAME_STATE.CHOICE && (
          <div className="overlay choice">
            <span className="choice-title">{t('game.chooseAugment')}</span>
            <div className="choice-list">
              {hudRawRef.current.choices.map((choice) => (
                <div
                  className="choice-card"
                  key={choice.id}
                  style={{ borderColor: choice.rarityColor }}
                  onClick={() => {
                    choice.func(
                      choice.arg,
                      choice.type === CHOICE_TYPE.AUGMENT ? choice.bonus
                        : choice.type === CHOICE_TYPE.WEAPON ? choice.wpn
                          : choice.enchant,
                    );
                    engineRef.current.madeChoice();
                  }}
                >
                  <span className="choice-rarity" style={{ backgroundColor: choice.rarityColor }}>
                    {tRarity(choice.rarityName)}
                  </span>

                  <img className="choice-img" src={choice.icon || 'temp.png'} alt="icon" />

                  {/* AUGMENT */}
                  {choice.type === CHOICE_TYPE.AUGMENT && (
                    <>
                      <span className="choice-attr">{tAttr(choice.attr)}</span>
                      <div className="choice-stats-container">
                        <span className="choice-curr">
                          {t('game.choice.current', { value: choice.curr })}
                        </span>
                        <span className="choice-bonus">
                          {choice.bonus > 0 ? '+' : ''}{choice.bonus}%
                        </span>
                        <span className="choice-new">
                          {t('game.choice.newValue', { value: choice.new })}
                        </span>
                      </div>
                    </>
                  )}

                  {/* WEAPON */}
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

                  {/* ENCHANT */}
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
                          const statusClass = diff === 0 ? '' : isBonus ? 'bonus' : 'malus';
                          return (
                            <div className="choice-enchant-attr" key={prop}>
                              <span className="choice-enchant-attr-title">{tProp(prop)}</span>
                              <span className={`choice-enchant-attr-value ${statusClass}`}>
                                {diff >= 0 && '+'}{diff}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            {hudRawRef.current.rerollsLeft > 0 && hudRawRef.current.wave > 0 && (
              <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <button
                  className='menu-btn'
                  onClick={() => engineRef.current.rerollChoice()}
                >
                  Reroll Choices ({hudRawRef.current.rerollsLeft} left)
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── HUD ── */}
        {hudRawRef.current.gameState === GAME_STATE.RUNNING && (
          <div className="hud">
            {[
              ['game.hud.score', hudRawRef.current.score],
              ['game.hud.time', formatDurationToHours(hudRawRef.current.elapsed)],
              ['game.hud.wave', hudRawRef.current.wave],
              ['game.hud.kills', hudRawRef.current.kills],
            ].map(([labelKey, value]) => (
              <div className="hud-stat" key={labelKey}>
                <span className="hud-stat-label">{t(labelKey)}</span>
                <span className="hud-stat-value">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Player card ── */}
        {hudRawRef.current.gameState === GAME_STATE.RUNNING && hudRawRef.current.player && (() => {
          const p = hudRawRef.current.player;
          const w = p.weapon;
          const hpPct = p.maxHp > 0 ? Math.round((p.hp / p.maxHp) * 100) : 0;
          const hpValCls = hpPct <= 25 ? 'pc-hp-value hp-low' : hpPct <= 50 ? 'pc-hp-value hp-mid' : 'pc-hp-value';
          const hpBarCls = hpPct <= 25 ? 'hp-bar-fill hp-low' : hpPct <= 50 ? 'hp-bar-fill hp-mid' : 'hp-bar-fill';

          return (
            <div className="player-card">
              <span className="pc-identity">
                {isLoggedIn ? user?.username : t('game.playerCard.guest')}
              </span>

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
                    {w.enchant === WEAPON_ENCHANT.TRANSFER && (
                      <>
                        <span className="pw-stat">
                          <span className="pw-label">{t('game.playerCard.chain')}</span>
                          <span className="pw-value">{Math.round(w.transferRadius ?? 0)}</span>
                        </span>
                        <span className="pw-stat">
                          <span className="pw-label">{t('game.playerCard.fall')}</span>
                          <span className="pw-value">-{w.transferDamageReduction ?? 0}%</span>
                        </span>
                      </>
                    )}
                  </div>
                </>
              )}

              <span className="pc-stat">
                <span className="pc-label">{t('game.playerCard.ms')}</span>
                <span className="pc-value">{Math.round(p.speed)}</span>
              </span>
            </div>
          );
        })()}

        {/* ── Items grid ── */}
        {hudRawRef.current.gameState === GAME_STATE.RUNNING && (() => {
          const items = hudRawRef.current.player?.items ?? [];
          const slots = Array.from({ length: 6 }, (_, i) => items[i] ?? null);
          return (
            <div className="items-grid">
              {slots.map((item, i) => {
                if (!item) return <div key={i} className="item-slot empty" />;
                const cdPct = item.cooldown
                  ? Math.round((1 - item.cooldownTime / item.cooldown) * 100)
                  : 100;
                const isReady = !item.cooldown || item.cooldownTime <= 0;
                return (
                  <div key={i} className="item-slot">
                    <img src={item.icon || 'temp.png'} alt={item.name} />
                    {item.cooldown && (
                      <>
                        <span className="item-slot-cd">
                          {item.cooldownTime > 0 ? Number(item.cooldownTime).toFixed(1) : ''}
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

        {/* ── Wave timer bar ── */}
        <div className="wave-time">
          <div
            className="wave-remaining-time"
            style={{ width: `${hudRawRef.current.waveTimer / WAVE_INTERVAL * 100}%` }}
          />
        </div>

        {/* ── Wave announcement ── */}
        {hudRawRef.current.gameState === GAME_STATE.RUNNING
          && hudRawRef.current.waveMsg?.duration > 0 && (
            <div className={`wave-info ${hudRawRef.current.waveMsg.duration < 0.5 ? 'exit' : ''}`}>
              <span className="wave-title">
                {t('game.wave', { number: hudRawRef.current.waveMsg.waveNumber })}
              </span>
            </div>
          )}

        <canvas ref={canvasRef} className="game-canvas" />
      </div>
    </>
  );
}

export default Game;