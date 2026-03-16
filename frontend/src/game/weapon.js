import { createBullet, BULLET_EXPLOS } from './bullet.js';
import { TEAM } from './world.js';

export const WEAPON_TYPE = {
    MELEE: 'melee',
    RANGE: 'range',
}

export const WEAPON_ENCHANT = {
    SINGLE: 'single',
    AOE: 'aoe',
    RIFLE: 'rifle',
    CHAIN: 'chain',
    PIERCE: 'pierce',
    LASER: 'laser',
    SUBMACHINEGUN: 'smg',
    LIFESTEAL: 'lifesteal',
    SWEETSPOT: 'sweetspot',
    MOMENTUM: 'momentum',
    DETONATOR: 'detonator',
    CHARGE: 'charge',
}

export function createWeapon(type, enchant) {
    let weapon;
    switch (type) {
        case WEAPON_TYPE.MELEE:
            weapon = {
                cooldownTime: 0.8,
                cooldown: 0.8,
                damage: 20,
                range: 65,
                angle: 90,
                type: WEAPON_TYPE.MELEE,
                props: ['cooldown', 'damage', 'range', 'angle'],
            }
            break;
        case WEAPON_TYPE.RANGE:
        default:
            weapon = {
                cooldownTime: 0.6,
                cooldown: 0.6,
                bulletSpeed: 500,
                damage: 15,
                range: 350,
                bulletWidth: 3,
                type: WEAPON_TYPE.RANGE,
                props: ['cooldown', 'damage', 'range', 'bulletWidth'],
            }
            break;
    }

    enchantWeapon(weapon, createEnchant(enchant));
    return weapon;
}

export function createEnchant(enchant) {
    switch (enchant) {
        case WEAPON_ENCHANT.RIFLE:
            return {
                name: WEAPON_ENCHANT.RIFLE,
                cooldown: 150,
                damage: 90,
                range: 95,
                support: [WEAPON_TYPE.RANGE],
                rifle: 3,
                burstInterval: 0.1,
                props: ['rifle', 'burstInterval'],
                bonusProps: ['cooldown', 'damage', 'range'],
            }
        case WEAPON_ENCHANT.PIERCE:
            return {
                name: WEAPON_ENCHANT.PIERCE,
                cooldown: 115,
                damage: 92.5,
                range: 75,
                support: [WEAPON_TYPE.RANGE],
                pierce: 3,
                props: ['pierce'],
                bonusProps: ['cooldown', 'damage', 'range'],
            }
        case WEAPON_ENCHANT.AOE:
            return {
                name: WEAPON_ENCHANT.AOE,
                cooldown: 135,
                damage: 85,
                range: 85,
                support: [WEAPON_TYPE.RANGE],
                aoeRadius: 150,
                props: ['aoeRadius'],
                bonusProps: ['cooldown', 'damage', 'range'],
            }
        case WEAPON_ENCHANT.CHAIN:
            return {
                name: WEAPON_ENCHANT.CHAIN,
                cooldown: 115,
                damage: 95,
                range: 85,
                support: [WEAPON_TYPE.RANGE],
                chainRadius: 150,
                chain: 3,
                props: ['chainRadius', 'chain'],
                bonusProps: ['cooldown', 'damage', 'range'],
            }
        case WEAPON_ENCHANT.LASER:
            return {
                name: WEAPON_ENCHANT.LASER,
                cooldown: 150,
                damage: 110,
                range: 80,
                support: [WEAPON_TYPE.RANGE],
                bulletWidth: 12,
                laserCd: 1,
                props: ['bulletWidth', 'laserCd'],
                bonusProps: ['cooldown', 'damage', 'range']
            }
        case WEAPON_ENCHANT.SUBMACHINEGUN:
            return {
                name: WEAPON_ENCHANT.SUBMACHINEGUN,
                cooldown: 40,
                damage: 45,
                range: 65,
                support: [WEAPON_TYPE.RANGE],
                dispersion: 25,
                props: ['dispersion'],
                bonusProps: ['cooldown', 'damage', 'range']
            }
        case WEAPON_ENCHANT.LIFESTEAL:
            return {
                name: WEAPON_ENCHANT.LIFESTEAL,
                cooldown: 115,
                damage: 85,
                range: 90,
                support: [WEAPON_TYPE.MELEE],
                lifesteal: 1.5,
                props: ['lifesteal'],
                bonusProps: ['cooldown', 'damage', 'range'],
            }
        case WEAPON_ENCHANT.SWEETSPOT:
            return {
                name: WEAPON_ENCHANT.SWEETSPOT,
                cooldown: 125,
                damage: 75,
                range: 105,
                support: [WEAPON_TYPE.MELEE],
                sweetspot: 15,
                props: ['sweetspot'],
                bonusProps: ['cooldown', 'damage', 'range'],
            }
        case WEAPON_ENCHANT.MOMENTUM:
            return {
                name: WEAPON_ENCHANT.MOMENTUM,
                cooldown: 110,
                damage: 80,
                range: 95,
                support: [WEAPON_TYPE.MELEE],
                maxStacks: 10,
                damagePerStack: 9,
                cooldownPerStack: 6,
                stacks: 0,
                decay: 1.5,
                decayTime: 1.5,
                props: ['maxStacks', 'damagePerStack', 'cooldownPerStack', 'stacks', 'decay', 'decayTime'],
                bonusProps: ['cooldown', 'damage', 'range'],
            }
        case WEAPON_ENCHANT.DETONATOR:
            return {
                name: WEAPON_ENCHANT.DETONATOR,
                cooldown: 110,
                damage: 90,
                range: 95,
                support: [WEAPON_TYPE.MELEE],
                detonateRadius: 120,
                detonateDamage: 60,
                props: ['detonateRadius', 'detonateDamage'],
                bonusProps: ['cooldown', 'damage', 'range'],
            }
        case WEAPON_ENCHANT.CHARGE:
            return {
                name: WEAPON_ENCHANT.CHARGE,
                cooldown: 120,
                damage: 20,
                range: 30,
                support: [WEAPON_TYPE.MELEE],
                angle: 75,
                dmgSpeed: 250,
                rngSpeed: 250,
                maxCharge: 2.5,
                chargeTime: 0,
                props: ['angle', 'dmgSpeed', 'rngSpeed', 'maxCharge', 'chargeTime'],
                bonusProps: ['cooldown', 'damage', 'range'],
            }
        case WEAPON_ENCHANT.SINGLE:
        default:
            return {
                name: WEAPON_ENCHANT.SINGLE,
                cooldown: 100,
                damage: 100,
                support: [WEAPON_TYPE.MELEE, WEAPON_TYPE.RANGE],
                angle: 100,
                range: 100,
                props: [],
                bonusProps: [],
            }
    }
}

export function enchantWeapon(weapon, enchant) {
    if (!enchant?.support?.includes(weapon.type)) return;
    weapon.enchant = enchant.name;
    for (const prop of enchant.bonusProps) {
        weapon[prop] = parseFloat(((weapon[prop] * enchant[prop] / 100)).toFixed(2));
    }
    for (const prop of enchant.props) {
        weapon[prop] = enchant[prop];
    }
}

export function tryAttack(weapon, attacker, world, dt, inputState = null) {
    if (!weapon) return;

    const targetTeam = attacker.team === TEAM.PLAYER ? TEAM.ENEMY : TEAM.PLAYER;

    if (weapon.enchant === WEAPON_ENCHANT.RIFLE && (weapon.bulletsToFire ?? 0) > 0) {
        weapon.nextBurstTime -= Math.min(weapon.nextBurstTime, dt);
        if (weapon.nextBurstTime <= 0) {
            _spawnBullet(attacker, weapon, weapon.burstAngle, null, world);
            weapon.bulletsToFire--;
            weapon.nextBurstTime = weapon.burstInterval;
        }
        return;
    }

    if (weapon.enchant === WEAPON_ENCHANT.LASER && weapon.charging) {
        weapon.laserCdTime -= Math.min(dt, weapon.laserCdTime);
        if (weapon.laserCdTime > 0) return;

        _resolveLaser(weapon, attacker, targetTeam, world);
        weapon.charging = false;
        return;
    }

    if (weapon.enchant === WEAPON_ENCHANT.CHARGE) {
        if (inputState?.mouseDown) {
            weapon.chargeTime += Math.min(dt, weapon.maxCharge - weapon.chargeTime);
            weapon.charging = true;
            return;
        } else if (weapon.charging) {
            _resolveCharge(weapon, attacker, targetTeam, world);
            weapon.charging = false;
            weapon.chargeTime = 0;
            weapon.cooldownTime = weapon.cooldown;
            return;
        }
    }

    if (weapon.enchant === WEAPON_ENCHANT.MOMENTUM && weapon.stacks > 0) {
        weapon.decayTime -= Math.min(dt, weapon.decayTime);
        if (weapon.decayTime <= 0) weapon.stacks = 0;
    }

    weapon.cooldownTime -= Math.min(dt, weapon.cooldownTime);
    if (weapon.cooldownTime > 0) return;

    let effectiveDamage = weapon.damage;
    let effectiveCooldown = weapon.cooldown;

    if (weapon.enchant === WEAPON_ENCHANT.MOMENTUM && weapon.stacks > 0) {
        effectiveDamage *= 1 + (weapon.damagePerStack * weapon.stacks) / 100;
        effectiveCooldown *= 1 - (weapon.cooldownPerStack * weapon.stacks) / 100;
    }

    const candidates = world.actorsOnTeam(targetTeam)
        .filter(a => a.targetable !== false);

    let nearest = null;
    let nearestDist = Infinity;
    let angleToNearest;
    let didHit = false;
    let inRangeCandidates = [];

    for (const target of candidates) {
        const dx = target.x - attacker.x;
        const dy = target.y - attacker.y;
        const d = Math.hypot(dx, dy);
        const inRange = d <= target.radius + (attacker.radius ?? 0) + weapon.range;

        if (!inRange) continue;
        inRangeCandidates.push(target);
        const angle = Math.atan2(dy, dx);

        if (d < nearestDist) {
            nearestDist = d;
            angleToNearest = angle;
            nearest = target;
        }
    }

    for (const target of inRangeCandidates) {
        const dx = target.x - attacker.x;
        const dy = target.y - attacker.y;
        const angle = Math.atan2(dy, dx);

        let diff = Math.abs(angle - angleToNearest);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff > Math.PI / 180 * (weapon.angle ?? 360)) continue;

        if (weapon.type === WEAPON_TYPE.MELEE) {
            if (weapon.enchant === WEAPON_ENCHANT.LIFESTEAL) {
                const heal = effectiveDamage * weapon.lifesteal / 100;
                attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
            }
            if (weapon.enchant === WEAPON_ENCHANT.SWEETSPOT) {
                const d = Math.hypot(dx, dy);
                const radius = target.radius + (attacker.radius ?? 0) + weapon.range;
                const sweetspotThreshold = weapon.range * (weapon.sweetspot / 100);
                effectiveDamage *= d + sweetspotThreshold <= radius ? 0.25 : 1.75;
            }
            target.takeDamage(effectiveDamage, attacker, world);
            didHit = true;
        }
    }

    if (didHit && weapon.type === WEAPON_TYPE.MELEE) {
        weapon.cooldownTime = effectiveCooldown;
    }

    if (nearest && weapon.type === WEAPON_TYPE.RANGE) {
        _fireRanged(weapon, attacker, angleToNearest, world);
    }
}

function _fireRanged(weapon, attacker, angle, world) {
    if (weapon.enchant === WEAPON_ENCHANT.RIFLE) {
        weapon.bulletsToFire = Math.floor(weapon.rifle - 1);
        weapon.burstAngle = angle;
        weapon.nextBurstTime = weapon.burstInterval;
    }

    if (weapon.enchant === WEAPON_ENCHANT.LASER) {
        weapon.cooldownTime = weapon.cooldown;
        weapon.laserCdTime = weapon.laserCd;
        weapon.laserAngle = angle;
        weapon.charging = true;
        return;
    }

    let bulletType = BULLET_EXPLOS.HIT;
    let args;

    switch (weapon.enchant) {
        case WEAPON_ENCHANT.AOE:
            bulletType = BULLET_EXPLOS.AOE;
            args = { aoeRadius: weapon.aoeRadius };
            break;
        case WEAPON_ENCHANT.PIERCE:
            bulletType = BULLET_EXPLOS.PIERCE;
            args = { pierce: weapon.pierce };
            break;
        case WEAPON_ENCHANT.CHAIN:
            bulletType = BULLET_EXPLOS.CHAIN;
            args = { chainRadius: weapon.chainRadius, chain: weapon.chain };
            break;
        case WEAPON_ENCHANT.SUBMACHINEGUN:
            angle += (Math.random() >= 0.5 ? 1 : -1)
                * (Math.random() * (weapon.dispersion / 2))
                * (Math.PI / 180);
            break;
    }

    _spawnBullet(attacker, weapon, angle, { type: bulletType, args }, world);
    weapon.cooldownTime = weapon.cooldown;
}

function _spawnBullet(attacker, weapon, angle, overrides, world) {
    const type = overrides?.type ?? BULLET_EXPLOS.HIT;
    const args = overrides?.args ?? null;

    world.spawnActor(createBullet(
        attacker.x, attacker.y,
        weapon.bulletWidth ?? 3,
        angle,
        weapon.bulletSpeed ?? 500,
        weapon.damage,
        weapon.range,
        type, args,
        attacker.team,
    ));
}

function _resolveLaser(weapon, attacker, targetTeam, world) {
    const range = weapon.range;
    const angle = weapon.laserAngle;
    const width = weapon.bulletWidth;
    const cosA = Math.cos(-angle);
    const sinA = Math.sin(-angle);

    for (const target of world.actorsOnTeam(targetTeam)) {
        const relX = target.x - attacker.x;
        const relY = target.y - attacker.y;
        const localX = relX * cosA - relY * sinA;
        const localY = relX * sinA + relY * cosA;

        const closestX = Math.max(0, Math.min(localX, range));
        const closestY = Math.max(-width / 2, Math.min(localY, width / 2));
        const dist = Math.hypot(localX - closestX, localY - closestY);

        if (dist <= target.radius) {
            target.takeDamage(weapon.damage, attacker, world);
        }
    }
}

function _resolveCharge(weapon, attacker, targetTeam, world) {
    const weaponRange = weapon.range * (1 + weapon.chargeTime * weapon.rngSpeed / 100);
    const weaponDamage = weapon.damage * (1 + weapon.chargeTime * weapon.dmgSpeed / 100);
    let firstAngle;

    for (const target of world.actorsOnTeam(targetTeam)) {
        const dx = target.x - attacker.x;
        const dy = target.y - attacker.y;
        const d = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        if (d > target.radius + (attacker.radius ?? 0) + weaponRange) continue;

        if (firstAngle === undefined) {
            firstAngle = angle;
        } else {
            let diff = Math.abs(angle - firstAngle);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff > Math.PI / 180 * weaponRange) continue;
        }

        target.takeDamage(weaponDamage, attacker, world);
    }
}