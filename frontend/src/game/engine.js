import { createPlayer, updatePlayer, damagePlayer, healPlayer, increaseMaxHp } from './player.js';
import { createWave, updateEnemies, damageEnemy, ENEMY_TYPE } from './enemies.js';
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
    CHOICE: 'choice',
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
    let choices = [];

    // Time before next wave
    const WAVE_INTERVAL = 40;

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
        choices = [];
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
        for (const enemy of enemies) {
            if (enemy.type === ENEMY_TYPE.SHOOTER) {
                updateBullets(enemy.bullets, [player], dt);
            }
        }

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
                healPlayer(player, 20);
            enemies.push(...createWave(wave, player, canvas.width, canvas.height));
            waveState = {
                waveTitle: "WAVE " + wave,
                waveSubtitle: "",
                duration: WAVE_MSG_TIMER,
            }
            augment();
        }

        // Check game over
        if (player.hp <= 0) {
            state = GAME_STATE.GAME_OVER;
        }

        onHUDUpdate?.({
            score,
            elapsed,
            wave,
            player,
            gameState: state,
            waveState,
            kills,
            choices,
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
        let nearestTarget = 1e6;
        let angleToShoot;
        let targetToShoot;
        for (const target of targets) {
            const dx = target.x - attacker.x;
            const dy = target.y - attacker.y;
            const d = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx);
            if (d <= target.radius + attacker.radius + attacker.weapon.range) {
                if (d < nearestTarget) {
                    nearestTarget = d;
                    angleToShoot = angle;
                    targetToShoot = target;
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

        if (nearestTarget <= targetToShoot?.radius + attacker.radius + attacker.weapon.range && attacker.weapon.type === WEAPON_TYPE.RANGE)
            attackRange(attacker, angleToShoot);
    }

    function attackRange(attacker, angle) {
        fireBullet(attacker, angle);
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

    function augment() {
        state = GAME_STATE.CHOICE;

        const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

        const possibleChoices = [
            {
                id: 1,
                attr: "Damage",
                bonus: rand(10, 25),
                arg: player.weapon,
                getCurr: (arg) => arg.damage,
                getNew: (arg, b) => Math.round(arg.damage * (1 + b / 100)),
                func: (wpn, b) => { wpn.damage = Math.round(wpn.damage * (1 + b / 100)); },
            },
            {
                id: 2,
                attr: "Range",
                bonus: rand(5, 15),
                arg: player.weapon,
                getCurr: (arg) => arg.range,
                getNew: (arg, b) => Math.round(arg.range * (1 + b / 100)),
                func: (wpn, b) => { wpn.range = Math.round(wpn.range * (1 + b / 100)); },
            },
            {
                id: 3,
                attr: "Max HP",
                bonus: rand(10, 20),
                arg: player,
                getCurr: (arg) => arg.maxHp,
                getNew: (arg, b) => Math.round(arg.maxHp * (1 + b / 100)),
                func: increaseMaxHp,
            },
            {
                id: 4,
                attr: "Move Speed",
                bonus: rand(5, 12),
                arg: player,
                getCurr: (arg) => arg.speed,
                getNew: (arg, b) => Math.round(arg.speed * (1 + b / 100)),
                func: (p, b) => { p.speed = Math.round(p.speed * (1 + b / 100)); },
            },
            {
                id: 5,
                attr: "Cooldown",
                bonus: -1 * rand(5, 10),
                arg: player.weapon,
                getCurr: (arg) => arg.cooldownTime,
                getNew: (arg, b) => (arg.cooldownTime * (1 + b / 100).toFixed(2)),
                func: (wpn, b) => { wpn.cooldownTime = (wpn.cooldownTime * (1 + b / 100)).toFixed(2); },
            }
        ];

        choices = possibleChoices
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map(choice => {
                const currentVal = choice.getCurr(choice.arg);
                const newVal = choice.getNew(choice.arg, choice.bonus);

                return {
                    id: choice.id,
                    attr: choice.attr,
                    bonus: choice.bonus,
                    curr: currentVal,
                    new: newVal,
                    arg: choice.arg,
                    func: choice.func
                };
            });

        onHUDUpdate?.({
            score,
            elapsed,
            wave,
            hp: player.hp,
            maxHp: player.maxHp,
            gameState: state,
            kills: kills,
            choices: choices,
        });
    }

    function render() {
        const w = canvas.width;
        const h = canvas.height;

        drawBackground(ctx, w, h);
        drawEnemies(ctx, enemies);
        drawPlayer(ctx, player);
        drawWeapon(ctx, player);
        drawBullets(ctx, player.bullets);

        for (const enemy of enemies) {
            drawWeapon(ctx, enemy);
            if (enemy.type === ENEMY_TYPE.SHOOTER) {
                drawBullets(ctx, enemy.bullets);
            }
        }
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
                player,
                gameState: state,
                kills,
                choices,
            });
        },

        madeChoice() {
            if (state === GAME_STATE.CHOICE) state = GAME_STATE.RUNNING;
            onHUDUpdate?.({
                score,
                elapsed,
                wave,
                player,
                gameState: state,
                kills,
                choices,
            });
        }
    };
}