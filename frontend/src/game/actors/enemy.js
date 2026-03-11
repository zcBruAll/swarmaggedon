import { createWeapon, tryAttack, WEAPON_TYPE, WEAPON_ENCHANT } from '../weapon.js';
import { TEAM } from '../world.js';

export const ENEMY_TYPE = {
    RUNNER: 'runner',       // Fast, low hp
    BRUTE: 'brute',         // slow, tanky, big damage
    SHOOTER: 'shooter',     // Keeps distance, fire bullets
    BOSS: 'boss',           // Giant, appears every X waves
}

export const BOSS_WAVE_INTERVAL = 10;

const BASE_STATS = {
    [ENEMY_TYPE.RUNNER]: {
        radius: 6,
        hp: 10,
        speed: 140,
        damage: 12,
        range: 50,
        cooldownInterval: 1,
        score: 8,
        color: '#e74c3c',
    },
    [ENEMY_TYPE.BRUTE]: {
        radius: 14,
        hp: 45,
        speed: 55,
        damage: 35,
        range: 48,
        cooldownInterval: 2,
        score: 25,
        color: '#8e44ad',
    },
    [ENEMY_TYPE.SHOOTER]: {
        radius: 8,
        hp: 18,
        speed: 80,
        score: 20,
        range: 280,
        cooldownInterval: 4,
        damage: 30,
        bullets: [],
        color: '#e67e22',
    },
    [ENEMY_TYPE.BOSS]: {
        radius: 32,
        hp: 150,
        speed: 70,
        damage: 50,
        range: 350,
        cooldownInterval: 1,
        score: 300,
        color: '#c0392b',
    }
}

const WAVE_SCALE = {
    [ENEMY_TYPE.RUNNER]: {
        hp: 1.07,
        speed: 1.04,
        damage: 1.06,
        range: 1.008,
    },
    [ENEMY_TYPE.BRUTE]: {
        hp: 1.10,
        speed: 1.02,
        damage: 1.07,
        range: 1.005,
    },
    [ENEMY_TYPE.SHOOTER]: {
        hp: 1.08,
        speed: 1.02,
        damage: 1.07,
        range: 1.01
    },
    [ENEMY_TYPE.BOSS]: {
        hp: 1.12,
        speed: 1.03,
        damage: 1.08,
        range: 1.01,
    },
}

function scaleStats(base, mult, wave) {
    return base * Math.pow(mult, wave - 1);
}

export function spawnEnemy(player, enemy, minAngle = 0, maxAngle = Math.PI * 2, safeRadius = 180) {
    // Compute random spawn position
    const randAngle = minAngle + Math.random() * (maxAngle - minAngle);
    const randDist = Math.random() * 300;
    const spawnRadius = safeRadius + randDist;
    enemy.x = player.x + Math.cos(randAngle) * spawnRadius;
    enemy.y = player.y + Math.sin(randAngle) * spawnRadius;
}

export function createEnemy(type, wave) {
    const base = BASE_STATS[type];
    const scale = WAVE_SCALE[type];

    const hp = scaleStats(base.hp, scale.hp, wave);

    let weapon;
    if (type === ENEMY_TYPE.SHOOTER) {
        weapon = createWeapon(WEAPON_TYPE.RANGE);
    } else if (type === ENEMY_TYPE.BOSS) {
        weapon = createWeapon(WEAPON_TYPE.RANGE, WEAPON_ENCHANT.LASER);
        weapon.bulletWidth = base.radius / 1.4;
    } else {
        weapon = createWeapon(WEAPON_TYPE.MELEE);
    }

    weapon.cooldown = base.cooldownInterval;
    weapon.cooldownTime = base.cooldownInterval;
    weapon.damage = scaleStats(base.damage, scale.damage, wave);
    weapon.range = scaleStats(base.range, scale.range, wave);

    return {
        isActor: true,
        team: TEAM.ENEMY,
        targetable: false,
        persistent: false,
        drawType: 'enemy',
        score: base.score,

        x: 0, y: 0,
        spawnIn: 0,
        spawnData: null,

        radius: base.radius,
        hp,
        maxHp: hp,
        speed: scaleStats(base.speed, scale.speed, wave),
        weapon,
        type,
        color: base.color,
        angle: 0,

        dead: false,

        update(dt, world) {
            if (this.spawnIn > 0) {
                this.spawnIn -= Math.min(this.spawnIn, dt);

                if (this.spawnIn <= 1.5 && !this.x && !this.y) {
                    const anchor = world.nearestActor(0, 0, TEAM.PLAYER) ?? { x: 0, y: 0 };
                    _spawnAt(this, anchor, this.spawnData);
                }
                return;
            }

            if (!this.targetable) this.targetable = true;

            const target = world.nearestActor(this.x, this.y, TEAM.PLAYER);
            if (!target) return;

            this._moveToward(target, dt);
            this.angle = Math.atan2(target.y - this.y, target.x - this.x);

            tryAttack(this.weapon, this, world, dt);
        },

        _moveToward(target, dt) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist <= 0) return;

            if (this.type === ENEMY_TYPE.SHOOTER) {
                const ideal = this.weapon.range * 0.85;
                const diff = dist - ideal;
                if (Math.abs(diff) > 20) {
                    const sign = diff > 0 ? 1 : -1;
                    this.x += (dx / dist) * this.speed * sign * dt;
                    this.y += (dy / dist) * this.speed * sign * dt;
                } else {
                    this.x += (-dy / dist) * this.speed * 0.5 * dt;
                    this.y += (dx / dist) * this.speed * 0.5 * dt;
                }
            } else {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }
        },

        takeDamage(amount) {
            this.hp -= Math.min(amount, this.hp);
        },

        onDeath() { },
        draw() { },
    };
}

export function createWave(wave, anchorActor) {
    const isBossWave = wave % BOSS_WAVE_INTERVAL == 0;
    const queue = [];

    if (isBossWave) {
        queue.push(createEnemy(ENEMY_TYPE.BOSS, wave));
        const runnerCount = 1 + Math.floor(wave / 10);
        for (let i = 0; i < runnerCount; i++) {
            queue.push(createEnemy(ENEMY_TYPE.RUNNER, wave));
        }
    } else {
        const runnerCount = Math.max(2, Math.floor(wave * 0.8) + 2);
        const bruteCount = Math.max(0, Math.floor((wave - 3) / 3));
        const shooterCount = Math.max(0, Math.floor((wave - 4) / 4));

        for (let i = 0; i < runnerCount; i++) {
            queue.push(createEnemy(ENEMY_TYPE.RUNNER, wave));
        }
        for (let i = 0; i < bruteCount; i++) {
            queue.push(createEnemy(ENEMY_TYPE.BRUTE, wave));
        }
        for (let i = 0; i < shooterCount; i++) {
            queue.push(createEnemy(ENEMY_TYPE.SHOOTER, wave));
        }
    }

    for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    const startAngle = Math.random() * Math.PI * 2;
    const baseArc = Math.PI * 0.5;

    queue.forEach((enemy, index) => {
        const squadSize = 4 + Math.floor(wave / 6);
        const squadIndex = Math.floor(index / squadSize);

        enemy.spawnIn = squadIndex * 2 + Math.random();

        enemy.spawnData = {
            minAngle: startAngle,
            maxAngle: startAngle + Math.min(Math.PI * 2, baseArc + (squadIndex * 0.5)),
            safeRadius: 180
        };
    });

    if (queue.length > 0) {
        queue[0].spawnIn = 0;
        _spawnAt(queue[0], anchorActor, queue[0].spawnData);
    }

    return queue;
}

export function separateEnemies(enemies) {
    for (const a of enemies) {
        if (a.spawnIn > 0) continue;
        for (const b of enemies) {
            if (b === a || b.spawnIn > 0) continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);
            const minDist = a.radius + b.radius + 3;

            if (dist < minDist && dist > 0) {
                // Overlap ratio between 0 and 1
                const overlap = (minDist - dist) / minDist;
                // Push enemies proportional to overlap
                const force = overlap * 0.5;
                const nx = (dx / dist) * force;
                const ny = (dy / dist) * force;

                // Heavier enemies yield less
                const massA = a.radius * a.radius;
                const massB = b.radius * b.radius;
                const totalMass = massA + massB;

                a.x -= nx * (massB / totalMass);
                a.y -= ny * (massB / totalMass);
                b.x += nx * (massA / totalMass);
                b.y += ny * (massA / totalMass);
            }
        }
    }
}

function _spawnAt(enemy, anchor, spawnData) {
    const { minAngle, maxAngle, safeRadius } = spawnData;
    const randAngle = minAngle + Math.random() * (maxAngle - minAngle);
    const spawnDist = safeRadius + Math.random() * 300;
    enemy.x = anchor.x + Math.cos(randAngle) * spawnDist;
    enemy.y = anchor.y + Math.sin(randAngle) * spawnDist;
}