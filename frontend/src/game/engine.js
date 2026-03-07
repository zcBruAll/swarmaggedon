import { createPlayer, updatePlayer, damagePlayer, healPlayer } from './player.js';
import { createWave, updateEnemies, damageEnemy, ENEMY_TYPE } from './enemies.js';
import { initInput, destroyInput, flushInput, input } from './input.js';
import {
    drawBackground, drawPlayer, drawEnemies,
    drawWeapon,
    drawBullets,
} from './renderer.js';
import { WEAPON_ENCHANT, WEAPON_TYPE, fireBullet } from './weapon.js';
import { createBullet, updateBullets } from './bullet.js';
import { CHOICE_TYPE, getChoices, getEnchantChoices, getWeaponChoices } from './choice.js';

export const GAME_STATE = {
    RUNNING: 'running',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    CHOICE: 'choice',
};

const CAMERA_FREE_SPACE = 35;
let CAMERA_PADDING = 150;

// Time before next wave
export const WAVE_INTERVAL = 60;

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
    let wave = 0;
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
        drawBackground(ctx, canvas.width, canvas.height);

        player = createPlayer(canvas.width, canvas.height);
        score = 0;
        elapsed = 0;
        waveTimer = WAVE_INTERVAL;
        state = GAME_STATE.RUNNING;
        choices = [];
        wave = 0;
        kills = 0;
        augment(CHOICE_TYPE.WEAPON);
        wave = 1;
        enemies = createWave(wave, player, canvas.width, canvas.height);
        waveState = {
            waveTitle: "WAVE " + wave,
            waveSubtitle: "",
            duration: WAVE_MSG_TIMER,
        };
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

        let spawnedEnemies = enemies.filter(enemy => enemy.spawnIn <= 0);

        // Player movement
        updatePlayer(player, input, dt, spawnedEnemies, canvas.width, canvas.height);

        // Enemies movement
        updateEnemies(enemies, player, dt);

        updateCamera(camera, player, enemies, canvas.width, canvas.height);

        updateBullets(player.bullets, spawnedEnemies, dt);
        for (const enemy of spawnedEnemies) {
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
            waveTimer = WAVE_INTERVAL;
            if (enemies?.length === 0) {
                player.bullets = [];
                healPlayer(player, 20);
                if (wave === 20) {
                    augment(CHOICE_TYPE.ENCHANT);
                } else {
                    augment();
                }
            }
            wave += 1;
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
        tryAttack(dt, player, enemies.filter(enemy => enemy.spawnIn <= 0), damageEnemy);
    }

    function EnemiesAttackPlayer(dt) {
        for (const enemy of enemies) {
            if (enemy.spawnIn > 0) continue;
            tryAttack(dt, enemy, [player], damagePlayer);
        }
    }

    function tryAttack(dt, attacker, targets, fun) {
        if (!attacker?.weapon) return;

        if (attacker.weapon.enchant === WEAPON_ENCHANT.RIFLE && (attacker.weapon.bulletsToFire ?? 0) > 0) {
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

        if (attacker.weapon.enchant === WEAPON_ENCHANT.LASER && attacker.weapon.charging) {
            attacker.weapon.laserCdTime -= Math.min(dt, attacker.weapon.laserCdTime);
            if (attacker.weapon.laserCdTime > 0) return;

            const range = attacker.weapon.range;
            const angle = attacker.weapon.laserAngle;
            const width = attacker.weapon.bulletWidth;

            for (const target of targets) {
                // Relative position of the target from the attacker
                const relX = target.x - attacker.x;
                const relY = target.y - attacker.y;

                // Rotate target's position by negative laser angle
                // Aligns the laser with the X-axis -> easier math
                const cosA = Math.cos(-angle);
                const sinA = Math.sin(-angle);
                const localX = relX * cosA - relY * sinA;
                const localY = relX * sinA + relY * cosA;

                // Closest point on the rectangle to the circle center
                const closestX = Math.max(0, Math.min(localX, range));
                const closestY = Math.max(-width / 2, Math.min(localY, width / 2));

                // Distance from closest to local circle center
                const dx = localX - closestX;
                const dy = localY - closestY;
                const distance = Math.hypot(dx, dy);

                if (distance <= target.radius) {
                    fun(target, attacker.weapon.damage);
                }
            }

            attacker.weapon.charging = false;
            return;
        }

        attacker.weapon.cooldownTime -= Math.min(dt, attacker.weapon.cooldownTime);
        if (attacker.weapon.cooldownTime > 0) return;

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
                attacker.weapon.cooldownTime = attacker.weapon.cooldown;

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

    function augment(type) {
        state = GAME_STATE.CHOICE;

        switch (type) {
            case CHOICE_TYPE.WEAPON:
                choices = getWeaponChoices(wave, player);
                break;
            case CHOICE_TYPE.ENCHANT:
                if (player.weapon.type === WEAPON_TYPE.MELEE) {
                    choices = getChoices(wave, player);
                } else {
                    choices = getEnchantChoices(wave, player);
                }
                break;
            default:
                choices = getChoices(wave, player);
                break;
        }

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

        drawBackground(ctx, w, h, camera);
        drawEnemies(ctx, camera, enemies, w, h);
        drawPlayer(ctx, camera, player);
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