import { createPlayer, updatePlayer, damagePlayer, healPlayer, increaseMaxHp } from './player.js';
import { createWave, updateEnemies, damageEnemy, ENEMY_TYPE } from './enemies.js';
import { initInput, destroyInput, flushInput, input } from './input.js';
import {
    drawBackground, drawPlayer, drawEnemies,
    drawWeapon,
    drawBullets,
} from './renderer.js';
import { WEAPON_ACTION, WEAPON_TYPE, fireBullet } from './weapon.js';
import { createBullet, updateBullets } from './bullet.js';

export const GAME_STATE = {
    RUNNING: 'running',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    CHOICE: 'choice',
};

const CAMERA_FREE_SPACE = 35;
let CAMERA_PADDING = 150;

// Time before next wave
export const WAVE_INTERVAL = 40;

export function createEngine(canvas, onHUDUpdate) {
    let minValue = Math.min(canvas.width, canvas.height);
    CAMERA_PADDING = minValue / 2 - CAMERA_FREE_SPACE;

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
    let items = [];

    let camera = { x: 0, y: 0 };

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
            waveSubtitle: `WEAPON: ${player.weapon.type} · ${player.weapon.action}`,
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

        updateCamera(camera, player, enemies, canvas.width, canvas.height);

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
            if (enemies?.length === 0) {
                healPlayer(player, 20);
                augment();
            }
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
            waveTimer,
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

        if (attacker.weapon.action === WEAPON_ACTION.RIFLE && (attacker.weapon.bulletsToFire ?? 0) > 0) {
            attacker.weapon.nextBurstTime -= Math.min(attacker.weapon.nextBurstTime, dt);
            if (attacker.weapon.nextBurstTime <= 0) {
                attacker.bullets.push(createBullet(
                    attacker.x,
                    attacker.y,
                    attacker.weapon.burstAngle,
                    attacker.weapon.damage,
                    attacker.weapon.range,
                ));
                attacker.weapon.bulletsToFire--;
                attacker.weapon.nextBurstTime = attacker.weapon.burstInterval;
            }
        }

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

    function updateCamera(camera, player, enemies, w, h) {
        const dx = player.x - camera.x;
        const dy = player.y - camera.y;
        if (dx < CAMERA_PADDING) {
            camera.x -= (CAMERA_PADDING - dx);
        }
        else if (dx > w - CAMERA_PADDING) {
            camera.x += (dx - (w - CAMERA_PADDING));
        }

        if (dy < CAMERA_PADDING) {
            camera.y -= (CAMERA_PADDING - dy);
        }
        else if (dy > h - CAMERA_PADDING) {
            camera.y += (dy - (h - CAMERA_PADDING));
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

    function augment() {
        state = GAME_STATE.CHOICE;

        const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

        const RARITIES = {
            COMMON: { name: 'Common', color: '#bdc3c7', weight: 60, mult: 1.0 },
            RARE: { name: 'Rare', color: '#3498db', weight: 30, mult: 1.5 },
            EPIC: { name: 'Epic', color: '#9b59b6', weight: 8, mult: 2.0 },
            LEGENDARY: { name: 'Legendary', color: '#f1c40f', weight: 2, mult: 3.0 }
        };

        function getRandomRarity() {
            const totalWeight = Object.values(RARITIES).reduce((sum, r) => sum + r.weight, 0);
            let random = Math.random() * totalWeight;

            for (const key in RARITIES) {
                if (random < RARITIES[key].weight) return RARITIES[key];
                random -= RARITIES[key].weight;
            }
            return RARITIES.COMMON;
        }

        const possibleChoices = [
            {
                id: 1,
                attr: "Damage",
                getBonus: (mult) => rand(10 * mult, 17 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.damage,
                getNew: (arg, b) => Math.round(arg.damage * (1 + b / 100)),
                func: (wpn, b) => { wpn.damage = Math.round(wpn.damage * (1 + b / 100)); },
            },
            {
                id: 2,
                attr: "Range",
                getBonus: (mult) => rand(5 * mult, 15 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.range,
                getNew: (arg, b) => Math.round(arg.range * (1 + b / 100)),
                func: (wpn, b) => { wpn.range = Math.round(wpn.range * (1 + b / 100)); },
            },
            {
                id: 3,
                attr: "Max HP",
                getBonus: (mult) => rand(10 * mult, 15 * mult),
                arg: player,
                getCurr: (arg) => arg.maxHp,
                getNew: (arg, b) => Math.round(arg.maxHp * (1 + b / 100)),
                func: increaseMaxHp,
            },
            {
                id: 4,
                attr: "Move Speed",
                getBonus: (mult) => rand(5 * mult, 12 * mult),
                arg: player,
                getCurr: (arg) => arg.speed,
                getNew: (arg, b) => Math.round(arg.speed * (1 + b / 100)),
                func: (p, b) => { p.speed = Math.round(p.speed * (1 + b / 100)); },
            },
            {
                id: 5,
                attr: "Cooldown",
                getBonus: (mult) => -1 * rand(5 * mult, 10 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.cooldownTime,
                getNew: (arg, b) => (arg.cooldownTime * (1 + b / 100)).toFixed(2),
                func: (wpn, b) => { wpn.cooldownTime = (wpn.cooldownTime * (1 + b / 100)).toFixed(2); },
            }
        ];

        choices = possibleChoices
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map(choice => {
                const rarity = getRandomRarity();
                const bonus = choice.getBonus(rarity.mult);

                const currentVal = choice.getCurr(choice.arg);
                const newVal = choice.getNew(choice.arg, bonus);

                return {
                    id: choice.id,
                    attr: choice.attr,
                    bonus: bonus,
                    rarityName: rarity.name,
                    rarityColor: rarity.color,
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
            waveTimer,
            hp: player.hp,
            maxHp: player.maxHp,
            gameState: state,
            kills,
            choices,
        });
    }

    function render() {
        const w = canvas.width;
        const h = canvas.height;

        drawBackground(ctx, w, h);
        drawEnemies(ctx, camera, enemies);
        drawPlayer(ctx, camera, player);
        drawWeapon(ctx, camera, player, false);
        drawBullets(ctx, camera, player.bullets);

        for (const enemy of enemies) {
            drawWeapon(ctx, camera, enemy, false);
            if (enemy.type === ENEMY_TYPE.SHOOTER) {
                drawBullets(ctx, camera, enemy.bullets);
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
                waveTimer,
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
                waveTimer,
                player,
                gameState: state,
                kills,
                choices,
            });
        }
    };
}