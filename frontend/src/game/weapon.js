import { createBullet } from "./bullet.js"

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
}

export function createWeapon(type, enchant) {
    let weapon;
    switch (type) {
        case WEAPON_TYPE.MELEE:
            weapon = {
                cooldownTime: 0.8,
                cooldown: 0.8,
                damage: 20,
                type: WEAPON_TYPE.MELEE,
                angle: 90,
                range: 65,
                props: ['cooldown', 'damage', 'angle', 'range'],
            }
            break;
        case WEAPON_TYPE.RANGE:
        default:
            weapon = {
                cooldownTime: 0.6,
                cooldown: 0.6,
                damage: 15,
                type: WEAPON_TYPE.RANGE,
                range: 350,
                bulletWidth: 3,
                props: ['cooldown', 'damage', 'range'],
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
                rifle: 3,
                support: [WEAPON_TYPE.RANGE],
                burstInterval: 0.1,
                range: 95,
                props: ['rifle', 'burstInterval'],
                bonusProps: ['cooldown', 'damage', 'range'],
            }
        case WEAPON_ENCHANT.PIERCE:
            return {
                name: WEAPON_ENCHANT.PIERCE,
                cooldown: 115,
                damage: 92.5,
                support: [WEAPON_TYPE.RANGE],
                pierce: 3,
                range: 75,
                props: ['pierce'],
                bonusProps: ['cooldown', 'damage', 'range'],
            }
        case WEAPON_ENCHANT.AOE:
            return {
                name: WEAPON_ENCHANT.AOE,
                cooldown: 135,
                damage: 85,
                support: [WEAPON_TYPE.RANGE],
                aoeRadius: 150,
                range: 85,
                props: ['aoeRadius'],
                bonusProps: ['cooldown', 'damage', 'range'],
            }
        case WEAPON_ENCHANT.CHAIN:
            return {
                name: WEAPON_ENCHANT.CHAIN,
                cooldown: 115,
                damage: 95,
                support: [WEAPON_TYPE.RANGE],
                chainRadius: 150,
                chain: 3,
                range: 85,
                props: ['chainRadius', 'chain'],
                bonusProps: ['cooldown', 'damage', 'range'],
            }
        case WEAPON_ENCHANT.SINGLE:
        default:
            return {
                name: WEAPON_ENCHANT.SINGLE,
                cooldown: 100,
                cooldownTime: 100,
                damage: 100,
                support: [WEAPON_TYPE.MELEE, WEAPON_TYPE.RANGE],
                angle: 100,
                range: 100,
                props: [],
            }
    }
}

export function fireBullet(attacker, angle) {
    if (attacker.weapon.enchant === WEAPON_ENCHANT.RIFLE) {
        attacker.weapon.bulletsToFire = Math.floor(attacker.weapon.rifle - 1);
        attacker.weapon.burstAngle = angle;
        attacker.weapon.nextBurstTime = attacker.weapon.burstInterval;
    }
    let args;
    if (attacker.weapon.enchant === WEAPON_ENCHANT.AOE)
        args = { aoeRadius: attacker.weapon.aoeRadius };
    else if (attacker.weapon.enchant === WEAPON_ENCHANT.PIERCE)
        args = { pierce: attacker.weapon.pierce };
    else if (attacker.weapon.enchant === WEAPON_ENCHANT.CHAIN)
        args = { chainRadius: attacker.weapon.chainRadius, chain: attacker.weapon.chain };
    attacker.bullets.push(createBullet(attacker.x, attacker.y, attacker.weapon.bulletWidth, angle, attacker.weapon.damage, attacker.weapon.range, attacker.weapon.enchant, args));
    attacker.weapon.cooldown = attacker.weapon.cooldownTime;
}

export function enchantWeapon(weapon, enchant) {
    if (!enchant.support.includes(weapon.type)) return;

    weapon.enchant = enchant.name;
    for (const prop of weapon.props) {
        weapon[prop] *= enchant[prop] / 100;
    }

    for (const prop of enchant.props) {
        weapon[prop] = enchant[prop];
    }
}