import { createWorld, TEAM } from './world.js';
import { createPlayer } from './actors/player.js';
import { createEnemy, createWave, separateEnemies, ENEMY_TYPE, BOSS_WAVE_INTERVAL } from './actors/enemy.js';
import { initInput, destroyInput, flushInput, input } from './input.js';
import { drawBackground, drawActors } from './renderer.js';
import { WEAPON_TYPE } from './weapon.js';
import { CHOICE_TYPE, getChoices, getEnchantChoices, getWeaponChoices, getBossRewardChoices } from './choice.js';

export const GAME_STATE = {
    RUNNING: 'running',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    CHOICE: 'choice',
};

const CAMERA_FREE_SPACE = 35;
const WAVE_MSG_DURATION = 2;
export const WAVE_INTERVAL = 60;

const BASE_WIDTH = 700;

export function createEngine(canvas, onHUDUpdate) {
    const ctx = canvas.getContext('2d');

    let gameState = GAME_STATE.RUNNING;
    let lastTs = 0;
    let refId = null;

    let world = null;
    let player = null;

    let wave = 0;
    let waveTimer = WAVE_INTERVAL;
    let choices = [];
    let camera = { x: 0, y: 0, scale: 1 };
    let waveMsg = {
        waveNumber: 0,
        duration: 0,
    };

    let rerollsLeft = 2;
    let currentChoiceType = null;

    function _computeScale() {
        return Math.min(1, canvas.width / BASE_WIDTH);
    }

    function _screenToWorld(sx, sy) {
        const s = camera.scale;
        return {
            x: sx / s + camera.x,
            y: sy / s + camera.y,
        };
    }

    function init() {
        world = createWorld();
        wave = 0;

        player = createPlayer(canvas.width, canvas.height);
        world.actors.push(player);

        waveTimer = WAVE_INTERVAL;
        gameState = GAME_STATE.RUNNING;
        choices = [];

        rerollsLeft = 2;

        _openChoiceScreen(CHOICE_TYPE.WEAPON);
        wave = 1;
        _spawnWave(wave);
    }

    function loop(ts) {
        const dt = Math.min((ts - lastTs) / 1000, 0.1);
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
        const worldMouse = _screenToWorld(input.mouse.x, input.mouse.y);
        const scaledInput = {
            ...input,
            mouse: worldMouse,
        };

        for (const actor of world.actors) {
            if (actor.drawType === 'player') {
                actor.update(dt, world, scaledInput);
            } else {
                actor.update(dt, world);
            }
        }

        world.flushSpawns();

        const enemies = world.actors.filter(a => a.team === TEAM.ENEMY && !a.dead && a.hp > 0);
        separateEnemies(enemies);

        world.cleanupDead();

        _tickWave(dt);

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

                const completedWave = wave;
                let choiceType;
                if (completedWave === 20) {
                    choiceType = CHOICE_TYPE.ENCHANT;
                } else if (completedWave % BOSS_WAVE_INTERVAL === 0) {
                    choiceType = CHOICE_TYPE.BOSS_REWARD;
                }

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

        waveMsg = { waveNumber: wave, duration: WAVE_MSG_DURATION };
    }

    function _openChoiceScreen(type) {
        gameState = GAME_STATE.CHOICE;

        currentChoiceType = type;

        switch (type) {
            case CHOICE_TYPE.WEAPON: choices = getWeaponChoices(wave, player); break;
            case CHOICE_TYPE.ENCHANT: choices = getEnchantChoices(wave, player); break;
            case CHOICE_TYPE.BOSS_REWARD: choices = getBossRewardChoices(wave, player); break;
            default: choices = getChoices(wave, player); break;
        }

        _emitHUD();
    }

    function _updateCamera() {
        const scale = _computeScale();
        camera.scale = scale;

        const viewW = canvas.width / scale;
        const viewH = canvas.height / scale;

        const padX = CAMERA_FREE_SPACE / scale;
        const padY = CAMERA_FREE_SPACE / scale;

        const dx = player.x - camera.x;
        const dy = player.y - camera.y;

        if (dx < padX) camera.x -= padX - dx;
        else if (dx > viewW - padX) camera.x += dx - (viewW - padX);

        if (dy < padY) camera.y -= padY - dy;
        else if (dy > viewH - padY) camera.y += dy - (viewH - padY);
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
            rerollsLeft,
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
        },

        rerollChoice() {
            if (gameState === GAME_STATE.CHOICE && rerollsLeft > 0) {
                rerollsLeft--;
                _openChoiceScreen(currentChoiceType);
            }
        }
    };
}