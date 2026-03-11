import { createWorld, TEAM } from './world.js';
import { createPlayer } from './actors/player.js';
import { createEnemy, createWave, separateEnemies, ENEMY_TYPE } from './actors/enemy.js';
import { initInput, destroyInput, flushInput, input } from './input.js';
import { drawBackground, drawActors } from './renderer.js';
import { WEAPON_TYPE } from './weapon.js';
import { CHOICE_TYPE, getChoices, getEnchantChoices, getWeaponChoices } from './choice.js';

export const GAME_STATE = {
    RUNNING: 'running',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    CHOICE: 'choice',
};

const CAMERA_FREE_SPACE = 35;
const WAVE_MSG_DURATION = 2;
export const WAVE_INTERVAL = 60;

export function createEngine(canvas, onHUDUpdate) {
    const ctx = canvas.getContext('2d');
    let CAMERA_PADDING = Math.min(canvas.width, canvas.height) / 2 - CAMERA_FREE_SPACE;

    let gameState = GAME_STATE.RUNNING;
    let lastTs = 0;
    let refId = null;

    let world = null;
    let player = null;

    let wave = 0;
    let waveTimer = WAVE_INTERVAL;
    let choices = [];
    let camera = { x: 0, y: 0 };
    let waveMsg = {
        title: '',
        subtitle: '',
        duration: 0,
    };

    function init() {
        world = createWorld();
        wave = 0;

        player = createPlayer(canvas.width, canvas.height);
        world.actors.push(player);

        waveTimer = WAVE_INTERVAL;
        gameState = GAME_STATE.RUNNING;
        choices = [];

        _openChoiceScreen(CHOICE_TYPE.WEAPON);
        wave = 1;
        _spawnWave(wave);
    }

    function loop(ts) {
        const dt = Math.min((ts - lastTs) / 1000, 0.1); // Max at 100ms
        lastTs = ts;
        world.addElapsed(dt);

        if (gameState === GAME_STATE.RUNNING) {
            update(dt);
            render();
        }

        flushInput();
        refId = requestAnimationFrame(loop);
    }

    function update(dt) {
        for (const actor of world.actors) {
            if (actor.drawType === 'player') {
                actor.update(dt, world, input);
            } else {
                actor.update(dt, world);
            }
        }

        world.flushSpawns();

        const enemies = world.actors.filter(a => a.team === TEAM.ENEMY && !a.dead && a.hp > 0);
        separateEnemies(enemies);

        world.cleanupDead();

        _tickWave(dt);

        // Check game over
        if (player.hp <= 0) {
            gameState = GAME_STATE.GAME_OVER;
        }

        _emitHUD();
    }

    function _tickWave(dt) {
        if (waveMsg.duration > 0)
            waveMsg.duration -= Math.min(dt, waveMsg.duration);

        waveTimer -= dt;

        const enemiesAlive = world.actors.some(
            a => a.team === TEAM.ENEMY && a.hp > 0 && !a.dead
        );

        if (waveTimer <= 0 || !enemiesAlive) {
            waveTimer = WAVE_INTERVAL;

            if (!enemiesAlive) {
                const bulletsToRemove = world.actors.filter(
                    a => a.drawType === 'bullet' && a.team === TEAM.PLAYER
                );
                for (const b of bulletsToRemove) b.dead = true;

                player.heal(20);

                const choiceType = wave === 20 ? CHOICE_TYPE.ENCHANT : undefined;
                _openChoiceScreen(choiceType);
            }

            wave += 1;
            world.wave = wave;
            _spawnWave(wave);
        }
    }

    function _spawnWave(wave) {
        const enemies = createWave(wave, player);
        for (const e of enemies) world.actors.push(e);

        waveMsg = { title: 'WAVE ' + wave, subtitle: '', duration: WAVE_MSG_DURATION };
    }

    function _openChoiceScreen(type) {
        gameState = GAME_STATE.CHOICE;

        switch (type) {
            case CHOICE_TYPE.WEAPON: choices = getWeaponChoices(wave, player); break;
            case CHOICE_TYPE.ENCHANT: choices = getEnchantChoices(wave, player); break;
            default: choices = getChoices(wave, player); break;
        }

        _emitHUD();
    }

    function _updateCamera() {
        const w = canvas.width;
        const h = canvas.height;
        const dx = player.x - camera.x;
        const dy = player.y - camera.y;

        if (dx < CAMERA_PADDING) camera.x -= CAMERA_PADDING - dx;
        else if (dx > w - CAMERA_PADDING) camera.x += dx - (w - CAMERA_PADDING);

        if (dy < CAMERA_PADDING) camera.y -= CAMERA_PADDING - dy;
        else if (dy > h - CAMERA_PADDING) camera.y += dy - (h - CAMERA_PADDING);
    }

    function render() {
        _updateCamera();
        drawBackground(ctx, canvas.width, canvas.height, camera);
        drawActors(ctx, camera, world.actors, canvas.width, canvas.height);
    }

    function _emitHUD() {
        onHUDUpdate?.({
            score: world.score,
            kills: world.kills,
            elapsed: world.elapsed,
            wave,
            waveTimer,
            waveMsg,
            player,
            gameState,
            choices,
        });
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
            world.actors.length = 0;
            init();
        },

        getState() {
            return { gameState, score: world.score, elapsed, wave, player };
        },

        togglePause() {
            if (gameState === GAME_STATE.RUNNING) gameState = GAME_STATE.PAUSED;
            else if (gameState === GAME_STATE.PAUSED) gameState = GAME_STATE.RUNNING;
            _emitHUD();
        },

        madeChoice() {
            if (gameState === GAME_STATE.CHOICE) gameState = GAME_STATE.RUNNING;
            _emitHUD();
        }
    };
}