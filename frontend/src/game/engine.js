import { createWorld, TEAM } from './world.js';
import { createPlayer } from './actors/player.js';
import { createEngineer } from './actors/engineer.js';
import { createEnemy, createWave, separateEnemies, BOSS_WAVE_INTERVAL } from './actors/enemy.js';
import { DRONE_STATE } from './actors/drone.js';
import { initInput, destroyInput, flushInput, input } from './input.js';
import { drawBackground, drawActors } from './renderer.js';
import { WEAPON_ENCHANT } from './weapon.js';
import { CHOICE_TYPE, getChoices, getEnchantChoices, getWeaponChoices, getBossRewardChoices } from './choice.js';

export const GAME_STATE = {
    CLASS_SELECT: 'class_select',
    RUNNING: 'running',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    CHOICE: 'choice',
};

export const CLASS_DEFS = [
    {
        id: 'melee',
        label: 'Brawler',
        icon: '⚔️',
        description: 'Fights up close with powerful melee weapons. High risk, high reward.',
        stats: [
            { key: 'HP', value: '100' },
            { key: 'Speed', value: '180' },
            { key: 'Weapon', value: 'Melee' },
            { key: 'Playstyle', value: 'Aggressive' },
        ],
        color: '#8e44ad',
        startWeaponHint: 'Starts with a melee weapon pick',
    },
    {
        id: 'range',
        label: 'Ranger',
        icon: '🔫',
        description: 'Keeps enemies at bay with ranged weapons. Easier to learn.',
        stats: [
            { key: 'HP', value: '100' },
            { key: 'Speed', value: '180' },
            { key: 'Weapon', value: 'Ranged' },
            { key: 'Playstyle', value: 'Kiting' },
        ],
        color: '#2471a3',
        startWeaponHint: 'Starts with a ranged weapon pick',
    },
    {
        id: 'engineer',
        label: 'Engineer',
        icon: '🤖',
        description: 'Commands up to 4 drones that attack for you. Repair them to keep fighting.',
        stats: [
            { key: 'HP', value: '120' },
            { key: 'Speed', value: '160' },
            { key: 'Weapon', value: '4 Drones' },
            { key: 'Playstyle', value: 'Strategic' },
        ],
        color: '#27ae60',
        startWeaponHint: 'No weapon pick — drones fight for you',
    },
];

const CAMERA_FREE_SPACE = 35;
const WAVE_MSG_DURATION = 2;
export const WAVE_INTERVAL = 60;
const BASE_WIDTH = 700;

export function createEngine(canvas, onHUDUpdate) {
    const ctx = canvas.getContext('2d');

    let gameState = GAME_STATE.CLASS_SELECT;
    let playerClass = null;
    let lastTs = 0;
    let refId = null;

    let world = null;
    let player = null;

    let wave = 0;
    let waveTimer = WAVE_INTERVAL;
    let choices = [];
    let camera = { x: 0, y: 0, scale: 1 };
    let waveMsg = { waveNumber: 0, duration: 0 };

    let rerollsLeft = 2;
    let currentChoiceType = null;

    function _computeScale() { return Math.min(1, canvas.width / BASE_WIDTH); }

    function _screenToWorld(sx, sy) {
        const s = camera.scale;
        return { x: sx / s + camera.x, y: sy / s + camera.y };
    }

    function _isEngineer() { return player?.drawType === 'engineer'; }

    function init() {
        world = createWorld();
        wave = 0;

        if (playerClass === 'engineer') {
            player = createEngineer(canvas.width, canvas.height);
        } else {
            player = createPlayer(canvas.width, canvas.height);
        }

        world.actors.push(player);

        if (_isEngineer()) {
            for (const drone of player.drones) world.actors.push(drone);
        }

        world.onKillCallback = () => {
            const wpn = player.weapon;
            if (wpn?.enchant === WEAPON_ENCHANT.MOMENTUM) {
                wpn.stacks = Math.min(wpn.stacks + 1, wpn.maxStacks);
                wpn.decayTime = wpn.decay;
            }
        };

        waveTimer = WAVE_INTERVAL;
        choices = [];
        rerollsLeft = 2;

        if (_isEngineer()) {
            gameState = GAME_STATE.RUNNING;
        } else {
            _openChoiceScreen(CHOICE_TYPE.WEAPON);
        }

        wave = 1;
        _spawnWave(wave);
    }

    function loop(ts) {
        const dt = Math.min((ts - lastTs) / 1000, 0.1);
        lastTs = ts;

        if (gameState === GAME_STATE.CLASS_SELECT) {
            flushInput();
            refId = requestAnimationFrame(loop);
            return;
        }

        world.addElapsed(dt);
        if (gameState === GAME_STATE.RUNNING) { update(dt); render(); }
        flushInput();
        refId = requestAnimationFrame(loop);
    }

    function update(dt) {
        const worldMouse = _screenToWorld(input.mouse.x, input.mouse.y);
        const scaledInput = {
            ...input,
            mouse: worldMouse,
            mouseClicked: input.mouseClicked,
            rightMouseClicked: input.rightMouseClicked,
        };

        for (const actor of world.actors) {
            if (actor.drawType === 'player' || actor.drawType === 'engineer') {
                actor.update(dt, world, scaledInput);
            } else if (actor.drawType === 'drone') {
            } else {
                actor.update(dt, world);
            }
        }

        world.flushSpawns();

        const enemies = world.actors.filter(
            a => a.team === TEAM.ENEMY && !a.dead && a.hp > 0
        );
        separateEnemies(enemies);

        _cleanupNonDrones();
        _tickWave(dt);

        if (player.hp <= 0) gameState = GAME_STATE.GAME_OVER;

        _emitHUD();
    }

    function _cleanupNonDrones() {
        let w = 0;
        for (let r = 0; r < world.actors.length; r++) {
            const a = world.actors[r];

            if (a.drawType === 'drone') { world.actors[w++] = a; continue; }

            const isDead = a.hp <= 0 || a.dead;
            if (isDead && a.onDeath) a.onDeath(world);

            if (isDead && a.score) {
                world.addScore(a.score);
                world.addKill();
                if (world.onKillCallback) world.onKillCallback(a);
                const attacker = a._lastAttacker;
                if (attacker?.weapon?.enchant === 'detonator') {
                    const wpn = attacker.weapon;
                    world.aoeBlast(a.x, a.y, wpn.detonateRadius, wpn.detonateDamage, a.team, a);
                }
            }

            if (!isDead) world.actors[w++] = a;
        }
        world.actors.length = w;
    }

    function _tickWave(dt) {
        if (waveMsg.duration > 0) waveMsg.duration -= Math.min(dt, waveMsg.duration);
        waveTimer -= dt;

        const enemiesAlive = world.actors.some(
            a => a.team === TEAM.ENEMY && a.hp > 0 && !a.dead && a.drawType === 'enemy'
        );

        if (waveTimer <= 0 || !enemiesAlive) {
            waveTimer = WAVE_INTERVAL;

            if (!enemiesAlive) {
                world.actors
                    .filter(a => a.drawType === 'bullet' && a.team === TEAM.PLAYER)
                    .forEach(b => { b.dead = true; });

                if (player.weapon?.enchant === WEAPON_ENCHANT.MOMENTUM) {
                    player.weapon.stacks = 0;
                    player.weapon.decayTimer = 0;
                }

                player.heal(20);

                if (_isEngineer()) {
                    for (const drone of player.drones) {
                        drone.resetForNextWave(player);
                    }
                }

                const completedWave = wave;
                let choiceType;
                if (completedWave === 20) choiceType = CHOICE_TYPE.ENCHANT;
                else if (completedWave % BOSS_WAVE_INTERVAL === 0) choiceType = CHOICE_TYPE.BOSS_REWARD;

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

        const target = _choiceTarget();
        switch (type) {
            case CHOICE_TYPE.WEAPON: choices = getWeaponChoices(wave, target); break;
            case CHOICE_TYPE.ENCHANT: choices = getEnchantChoices(wave, target); break;
            case CHOICE_TYPE.BOSS_REWARD: choices = getBossRewardChoices(wave, target); break;
            default: choices = getChoices(wave, target); break;
        }

        if (type === CHOICE_TYPE.WEAPON && wave <= 1 && playerClass !== 'engineer') {
            choices = choices.filter(c => {
                if (!c.wpn) return true;
                return c.wpn.type === (playerClass === 'melee' ? 'melee' : 'range');
            });
            if (choices.length === 0) choices = getWeaponChoices(wave, target);
        }

        _emitHUD();
    }

    function _choiceTarget() {
        if (!_isEngineer()) return player;
        const drone = player.drones.find(d => d.weapon) ?? player.drones[0];
        return {
            ...player,
            weapon: drone?.weapon,
            speed: player.speed,
            increaseMaxHp: (p) => player.increaseMaxHp(p),
        };
    }

    function _updateCamera() {
        const scale = _computeScale();
        camera.scale = scale;
        const viewW = canvas.width / scale;
        const viewH = canvas.height / scale;
        const padX = (canvas.width / 2 - CAMERA_FREE_SPACE) / scale;
        const padY = (canvas.height / 2 - CAMERA_FREE_SPACE) / scale;
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
            score: world?.score ?? 0,
            kills: world?.kills ?? 0,
            elapsed: world?.elapsed ?? 0,
            wave,
            waveTimer,
            waveMsg,
            player,
            gameState,
            choices,
            rerollsLeft,
            isEngineer: _isEngineer(),
            drones: _isEngineer() ? player.drones : null,
            playerClass,
        });
    }

    return {
        start() {
            initInput(canvas);
            onHUDUpdate?.({ gameState: GAME_STATE.CLASS_SELECT });
            refId = requestAnimationFrame((ts) => { lastTs = ts; loop(ts); });
        },

        stop() {
            if (refId) cancelAnimationFrame(refId);
            destroyInput(canvas);
        },

        selectClass(id) {
            if (gameState !== GAME_STATE.CLASS_SELECT) return;
            playerClass = id;
            init();
            if (world) render();
            _emitHUD();
        },

        restart() {
            if (world) world.actors.length = 0;
            world = null;
            player = null;
            playerClass = null;
            gameState = GAME_STATE.CLASS_SELECT;
            onHUDUpdate?.({ gameState: GAME_STATE.CLASS_SELECT });
        },

        getState() {
            return { gameState, score: world?.score ?? 0, wave, player };
        },

        togglePause() {
            if (gameState === GAME_STATE.CHOICE ||
                gameState === GAME_STATE.CLASS_SELECT) return;
            gameState = gameState === GAME_STATE.RUNNING ? GAME_STATE.PAUSED : GAME_STATE.RUNNING;
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
        },
    };
}