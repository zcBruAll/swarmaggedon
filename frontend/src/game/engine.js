import { createPlayer, updatePlayer, damagePlayer } from './player.js';
import { spawnWave, updateEnemies, damageEnemy } from './enemies.js';
import { initInput, destroyInput, flushInput, input } from './input.js';
import {
    drawBackground, drawPlayer, drawEnemies,
    drawWeapon,
} from './renderer.js';

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

    // Time before next wave
    const WAVE_INTERVAL = 20;

    const hudState = {
        waveAnnouncement: null, // { text, timer } - shown on wave start
    };

    function init() {
        player = createPlayer(canvas.width, canvas.height);
        enemies = spawnWave(wave, canvas.width, canvas.height);
        score = 0;
        elapsed = 0;
        wave = 1;
        waveTimer = WAVE_INTERVAL;
        state = GAME_STATE.RUNNING;
    }

    function loop(ts) {
        const dt = Math.min((ts - lastTs) / 1000, 0.1); // Max at 100ms
        lastTs = ts;

        if (state === GAME_STATE.RUNNING) {
            update(dt);
        }

        render();
        flushInput();

        refId = requestAnimationFrame(loop);
    }

    function update(dt) {
        elapsed += dt;

        // Player movement
        updatePlayer(player, input, dt, canvas.width, canvas.height);

        // Enemies movement
        updateEnemies(enemies, player, dt);

        PlayerAttackEnemies(dt);

        cleanupEnemies();

        EnemiesAttackPlayer();

        // Wave progression
        waveTimer -= dt;
        if (waveTimer <= 0 || enemies?.length === 0) {
            wave += 1;
            waveTimer = WAVE_INTERVAL;
            enemies.push(...spawnWave(wave, canvas.width, canvas.height));
        }

        // Check game over
        if (!player.hp > 0) {
            state = GAME_STATE.GAME_OVER;
        }

        onHUDUpdate?.({
            score,
            elapsed,
            wave,
            hp: player.hp,
            gameState: state,
        });
    }

    function PlayerAttackEnemies(dt) {
        if (!player?.weapon) return;
        player.weapon.cooldown -= Math.min(dt, player.weapon.cooldown);
        if (player.weapon.cooldown > dt) return;

        for (const enemy of enemies) {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const d = Math.hypot(dx, dy);
            if (d <= enemy.radius + player.radius + player.weapon.radius) {
                player.weapon.cooldown = player.weapon.cooldownTime;
                damageEnemy(enemy, player.weapon.damage);
            }
        }
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
        let gainedScore = 0;

        for (let readIndex = 0; readIndex < enemies.length; readIndex++) {
            const enemy = enemies[readIndex];

            if (enemy.hp <= 0) {
                gainedScore += enemy.score;
            } else {
                enemies[writeIndex] = enemy;
                writeIndex++;
            }
        }

        score += gainedScore;

        enemies.length = writeIndex;
    }

    function render() {
        const w = canvas.width;
        const h = canvas.height;

        drawBackground(ctx, w, h);
        drawEnemies(ctx, enemies);
        drawPlayer(ctx, player);
        drawWeapon(ctx, player);
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