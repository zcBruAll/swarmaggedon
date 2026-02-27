import { createMeeleWeapon, createRangeWeapon } from "./weapon";

export const ENEMY_TYPE = {
    RUNNER: 'runner',       // Fast, low hp
    BRUTE: 'brute',         // slow, tanky, big damage
    SHOOTER: 'shooter',     // Keeps distance, fire bullets
    BOSS: 'boss',           // Giant, appears every X waves
}

const BOSS_WAVE_INTERVAL = 5;

const BASE_STATS = {
    [ENEMY_TYPE.RUNNER]: {
        radius: 6,
        hp: 8,
        speed: 180,
        damage: 15,
        cooldownInterval: 1,
        score: 8,
        color: '#e74c3c',
    },
    [ENEMY_TYPE.BRUTE]: {
        radius: 14,
        hp: 30,
        speed: 60,
        damage: 40,
        cooldownInterval: 2,
        score: 25,
        color: '#8e44ad',
    },
    [ENEMY_TYPE.SHOOTER]: {
        radius: 8,
        hp: 20,
        speed: 90,
        score: 20,
        cooldownInterval: 5,
        bullets: [],
        color: '#e67e22',
    },
    [ENEMY_TYPE.BOSS]: {
        radius: 30,
        hp: 100,
        speed: 80,
        damage: 60,
        cooldownInterval: 5,
        score: 200,
        color: '#c0392b',
    }
}

const WAVE_SCALE = {
    [ENEMY_TYPE.RUNNER]: {
        hp: 1.10,
        speed: 1.04,
        damage: 1.08,
    },
    [ENEMY_TYPE.BRUTE]: {
        hp: 1.15,
        speed: 1.03,
        damage: 1.10,
    },
    [ENEMY_TYPE.SHOOTER]: {
        hp: 1.10,
        speed: 1.03,
        damage: 1.10,
    },
    [ENEMY_TYPE.BOSS]: {
        hp: 1.20,
        speed: 1.05,
        damage: 1.12,
    },
}

function scaleStats(base, multiplier, wave) {
    return base * Math.pow(multiplier, wave - 1);
}

export function spawnEnemy(player, type, wave) {
    // Compute random spawn position
    const randAngle = Math.random() * Math.PI * 2;
    const randDist = Math.random() * 500;
    const safeRadius = 150;
    const spawnRadius = safeRadius + randDist;
    const x = player.x + Math.cos(randAngle) * spawnRadius;
    const y = player.y + Math.sin(randAngle) * spawnRadius;

    return createEnemy(type, x, y, wave)
}

export function createEnemy(type, x, y, wave) {
    const base = BASE_STATS[type];
    const scale = WAVE_SCALE[type];

    const hp = scaleStats(base.hp, scale.hp, wave);

    let weapon;

    if (type === ENEMY_TYPE.SHOOTER) {
        weapon = createRangeWeapon();
    } else {
        weapon = createMeeleWeapon();
    }

    weapon.cooldown = base.cooldownInterval;
    weapon.cooldownTime = base.cooldownInterval;
    weapon.damage = scaleStats(base.damage, scale.damage, wave);
    weapon.range *= 0.85;

    return {
        x: x,
        y: y,
        radius: base.radius,
        hp: hp,
        maxHp: hp,
        speed: scaleStats(base.speed, scale.speed, wave),
        score: base.score,
        weapon: weapon,
        type: type,
        color: base.color,
        bullets: base.bullets,
    };
}

export function updateEnemies(enemies, player, dt) {
    for (const enemy of enemies) {
        updateEnemy(enemy, player, dt);
    }
}

function updateEnemy(enemy, player, dt) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;

    const distance = Math.hypot(dx, dy);

    // Shooters remain at a specific distance from the player
    if (enemy.type === ENEMY_TYPE.SHOOTER) {
        const diff = distance - (enemy.weapon.range * 0.85);
        if (Math.abs(diff) > 20) {
            const sign = diff > 0 ? 1 : -1;
            enemy.x += (dx / distance) * enemy.speed * sign * dt;
            enemy.y += (dy / distance) * enemy.speed * sign * dt;
        } else {
            enemy.x += (-dy / distance) * enemy.speed * 0.5 * dt;
            enemy.y += (dx / distance) * enemy.speed * 0.5 * dt;
        }
    } else {
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed * dt;
            enemy.y += (dy / distance) * enemy.speed * dt;
        }
    }
}

export function createWave(wave, player, canvasWidth, canvasHeight) {
    const isBossWave = wave % BOSS_WAVE_INTERVAL == 0;
    const queue = [];

    if (isBossWave) {
        queue.push(spawnEnemy(player, ENEMY_TYPE.BOSS, wave));

        const runnerCount = 2 + Math.floor(wave / 5);
        for (let i = 0; i < runnerCount; i++) {
            queue.push(spawnEnemy(player, ENEMY_TYPE.RUNNER, wave));
        }
    } else {
        const runnerCount = Math.max(2, wave + 2);
        const bruteCount = Math.floor(wave / 3);
        const shooterCount = Math.floor(wave / 4);

        for (let i = 0; i < runnerCount; i++) {
            queue.push(spawnEnemy(player, ENEMY_TYPE.RUNNER, wave));
        }
        for (let i = 0; i < bruteCount; i++) {
            queue.push(spawnEnemy(player, ENEMY_TYPE.BRUTE, wave));
        }
        for (let i = 0; i < shooterCount; i++) {
            queue.push(spawnEnemy(player, ENEMY_TYPE.SHOOTER, wave));
        }
    }

    // Shuffle enemies queue
    for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    return queue;
}

export function damageEnemy(enemy, amount) {
    enemy.hp -= Math.min(amount, enemy.hp);
}