import { createPlayer, updatePlayer, damagePlayer } from './player.js';
import { spawnWave, updateEnemies, damageEnemy } from './enemies.js';
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
    const WAVE_INTERVAL = 20;

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
        enemies = spawnWave(wave, player, canvas.width, canvas.height);
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

        EnemiesAttackPlayer();

        // Wave progression
        if (waveState.duration > 0)
            waveState.duration -= Math.min(dt, waveState.duration);

        waveTimer -= dt;
        if (waveTimer <= 0 || enemies?.length === 0) {
            wave += 1;
            waveTimer = WAVE_INTERVAL;
            enemies.push(...spawnWave(wave, player, canvas.width, canvas.height));
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
            kills,
            waveState
        });
    }

    function PlayerAttackEnemies(dt) {
        if (!player?.weapon) return;
        player.weapon.cooldown -= Math.min(dt, player.weapon.cooldown);
        if (player.weapon.cooldown > dt) return;

        if (player.weapon.type == WEAPON_TYPE.RANGE) {
            attackRange();
            return;
        }

        let firstEnemyAngle = undefined;

        for (const enemy of enemies) {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const d = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx);
            if (d <= enemy.radius + player.radius + player.weapon.range) {
                if (firstEnemyAngle == undefined) {
                    firstEnemyAngle = angle;
                } else {
                    let diff = Math.abs(angle - firstEnemyAngle);

                    if (diff > Math.PI) {
                        diff = Math.PI * 2 - diff;
                    }

                    if (diff > Math.PI / 180 * player.weapon.angle) {
                        continue;
                    }
                }
                player.weapon.cooldown = player.weapon.cooldownTime;

                if (player.weapon.type == WEAPON_TYPE.MELEE)
                    attackMelee(enemy);
            }
        }
    }

    function attackRange() {
        fireBullet(player);
    }

    function attackMelee(enemy) {
        damageEnemy(enemy, player.weapon.damage);
    }

    function EnemiesAttackPlayer() {
        for (const enemy of enemies) {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d <= enemy.radius + player.radius) {
                damagePlayer(player, enemy.damage);
            }
        }
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