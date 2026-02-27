import { createPlayer, updatePlayer, damagePlayer, healPlayer } from './player.js';
import { createWave, updateEnemies, damageEnemy } from './enemies.js';
import { initInput, destroyInput, flushInput, input } from './input.js';
import {
    drawBackground, drawPlayer, drawEnemies,
    drawWeapon,
    drawBullets,
} from './renderer.js';
import { WEAPON_TYPE, fireBullet } from './weapon.js';
import { updateBullets } from './bullet.js';

export const GAME_STATE = {
    RUNNING: 'running',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
};

export function createEngine(canvas, onHUDUpdate) {
    const ctx = canvas.getContext('2d');

    let state = GAME_STATE.RUNNING;
    let lastTs = 0;
    let refId = null;

    let player = null;
    let enemies = [];
    let score = 0;
    let elapsed = 0;
    let wave = 1;
    let waveTimer = 0;
    let kills = 0;

    // Time before next wave
    const WAVE_INTERVAL = 30;

    const WAVE_MSG_TIMER = 2;
    let waveState = {
        waveTitle: "",
        waveSubtitle: "",
        duration: 0,
    };

    function init() {
        player = createPlayer(canvas.width, canvas.height);
        score = 0;
        elapsed = 0;
        wave = 1;
        enemies = createWave(wave, player, canvas.width, canvas.height);
        waveTimer = WAVE_INTERVAL;
        state = GAME_STATE.RUNNING;
        waveState = {
            waveTitle: "WAVE 1",
            waveSubtitle: "WEAPON: " + player.weapon.type,
            duration: WAVE_MSG_TIMER,
        }
    }

    function loop(ts) {
        const dt = Math.min((ts - lastTs) / 1000, 0.1); // Max at 100ms
        lastTs = ts;

        if (state === GAME_STATE.RUNNING) {
            update(dt);

            render();
        }
        flushInput();

        refId = requestAnimationFrame(loop);
    }

    function update(dt) {
        elapsed += dt;

        // Player movement
        updatePlayer(player, input, dt, enemies, canvas.width, canvas.height);

        // Enemies movement
        updateEnemies(enemies, player, dt);

        updateBullets(player.bullets, enemies, dt);

        PlayerAttackEnemies(dt);

        cleanupEnemies();

        EnemiesAttackPlayer(dt);

        // Wave progression
        if (waveState.duration > 0)
            waveState.duration -= Math.min(dt, waveState.duration);

        waveTimer -= dt;
        if (waveTimer <= 0 || enemies?.length === 0) {
            wave += 1;
            waveTimer = WAVE_INTERVAL;
            if (enemies?.length === 0)
                healPlayer(player, 15);
            enemies.push(...createWave(wave, player, canvas.width, canvas.height));
            waveState = {
                waveTitle: "WAVE " + wave,
                waveSubtitle: "",
                duration: WAVE_MSG_TIMER,
            }
        }

        // Check game over
        if (player.hp <= 0) {
            state = GAME_STATE.GAME_OVER;
        }

        onHUDUpdate?.({
            score,
            elapsed,
            wave,
            hp: player.hp,
            gameState: state,
            waveState,
            kills,
        });
    }

    function PlayerAttackEnemies(dt) {
        tryAttack(dt, player, enemies, damageEnemy);
    }

    function EnemiesAttackPlayer(dt) {
        for (const enemy of enemies) {
            tryAttack(dt, enemy, [player], damagePlayer);
        }
    }

    function tryAttack(dt, attacker, targets, fun) {
        if (!attacker?.weapon) return;
        attacker.weapon.cooldown -= Math.min(dt, attacker.weapon.cooldown);
        if (attacker.weapon.cooldown > 0) return;

        let firstTargetAngle = undefined;
        for (const target of targets) {
            const dx = target.x - attacker.x;
            const dy = target.y - attacker.y;
            const d = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx);
            if (d <= target.radius + attacker.radius + attacker.weapon.range) {
                if (attacker.weapon.type == WEAPON_TYPE.RANGE) {
                    attackRange(attacker);
                    break;
                }
                if (firstTargetAngle == undefined) {
                    firstTargetAngle = angle;
                } else {
                    let diff = Math.abs(angle - firstTargetAngle);

                    if (diff > Math.PI) {
                        diff = Math.PI * 2 - diff;
                    }

                    if (diff > Math.PI / 180 * attacker.weapon.angle) {
                        continue;
                    }
                }
                attacker.weapon.cooldown = attacker.weapon.cooldownTime;

                if (attacker.weapon.type == WEAPON_TYPE.MELEE)
                    attackMelee(target, attacker.weapon.damage, fun);
            }
        }
    }

    function attackRange(attacker) {
        fireBullet(attacker);
    }

    function attackMelee(target, damage, fun) {
        fun(target, damage);
    }

    function cleanupEnemies() {
        let writeIndex = 0;

        for (let readIndex = 0; readIndex < enemies.length; readIndex++) {
            const enemy = enemies[readIndex];

            if (enemy.hp <= 0) {
                score += enemy.score;
                kills += 1;
            } else {
                enemies[writeIndex] = enemy;
                writeIndex++;
            }
        }

        enemies.length = writeIndex;
    }

    function render() {
        const w = canvas.width;
        const h = canvas.height;

        drawBackground(ctx, w, h);
        drawEnemies(ctx, enemies);
        drawPlayer(ctx, player);
        drawWeapon(ctx, player);
        for (const enemy of enemies) {
            drawWeapon(ctx, enemy);
        }
        drawBullets(ctx, player.bullets);
    }

    return {
        start() {
            initInput(canvas);
            init();
            refId = requestAnimationFrame((ts) => {
                lastTs = ts;
                loop(ts);
            });
        },

        stop() {
            if (refId) cancelAnimationFrame(refId);
            destroyInput(canvas);
        },

        restart() {
            init();
        },

        getState() {
            return { state, score, elapsed, wave, player, enemies };
        },

        togglePause() {
            if (state === GAME_STATE.RUNNING) state = GAME_STATE.PAUSED;
            else if (state === GAME_STATE.PAUSED) state = GAME_STATE.RUNNING;
            onHUDUpdate?.({
                score,
                elapsed,
                wave,
                hp: player.hp,
                gameState: state,
            })
        },
    };
}