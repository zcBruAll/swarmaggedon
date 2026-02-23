import { createPlayer, updatePlayer, damagePlayer } from './player.js';
import { spawnWave, updateEnemies, damageEnemy } from './enemies.js';
import { initInput, destroyInput, flushInput, input } from './input.js';
import {
    drawBackground, drawPlayer, drawEnemies, drawGameOver, drawPause,
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

        // Collision (Enemies & player)
        resolveEnemiesPlayer();

        // Clear dead enemies
        enemies = enemies?.filter(e => !e.dead);

        // Wave progression
        waveTimer -= dt;
        if (waveTimer <= 0 || enemies?.length === 0) {
            // TODO: advance to next wave
        }

        // Check game over
        if (!player.isAlive) {
            state = GAME_STATE.GAME_OVER;
        }

        onHUDUpdate?.({
            score,
            elapsed,
            wave,
            hp: player.hp,
        });
    }

    function resolveEnemiesPlayer() {
        for (const enemy of enemies) {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d <= enemy.radius + player.radius) {
                damagePlayer(player, enemy.damage);
            }
        }
    }

    function render() {
        const w = canvas.width;
        const h = canvas.height;

        drawBackground(ctx, w, h);
        drawEnemies(ctx, enemies);
        drawPlayer(ctx, player);

        if (state === GAME_STATE.PAUSED) drawPause(ctx, w, h);
        if (state === GAME_STATE.GAME_OVER) drawGameOver(ctx, w, h, score, elapsed);
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
        },
    };
}