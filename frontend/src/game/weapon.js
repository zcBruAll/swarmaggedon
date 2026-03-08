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
    LASER: 'laser',
    SUBMACHINEGUN: 'submachinegun',
    LIFESTEAL: 'lifesteal',
    LUNGE: 'lunge',
    CLEAVE: 'cleave',
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
                lifesteal: 3,
                props: ['lifesteal'],
                bonusProps: ['cooldown', 'damage', 'range'],
            }
        case WEAPON_ENCHANT.LUNGE:
            return {
                name: WEAPON_ENCHANT.LUNGE,
                cooldown: 175,
                damage: 150,
                range: 90,
                support: [WEAPON_TYPE.MELEE],
                angle: 25,
                props: ['angle'],
                bonusProps: ['cooldown', 'damage', 'range'],
            }
        case WEAPON_ENCHANT.CLEAVE:
            return {
                name: WEAPON_ENCHANT.CLEAVE,
                cooldown: 125,
                damage: 70,
                range: 90,
                support: [WEAPON_TYPE.MELEE],
                angle: 180,
                props: ['angle'],
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

export function fireBullet(attacker, angle) {
    if (attacker.weapon.enchant === WEAPON_ENCHANT.RIFLE) {
        attacker.weapon.bulletsToFire = Math.floor(attacker.weapon.rifle - 1);
        attacker.weapon.burstAngle = angle;
        attacker.weapon.nextBurstTime = attacker.weapon.burstInterval;
    }
    if (attacker.weapon.enchant === WEAPON_ENCHANT.LASER) {
        attacker.weapon.cooldownTime = attacker.weapon.cooldown;
        attacker.weapon.laserCdTime = attacker.weapon.laserCd;
        attacker.weapon.laserAngle = angle;
        attacker.weapon.charging = true;
        return;
    }
    let args;
    if (attacker.weapon.enchant === WEAPON_ENCHANT.AOE)
        args = { aoeRadius: attacker.weapon.aoeRadius };
    else if (attacker.weapon.enchant === WEAPON_ENCHANT.PIERCE)
        args = { pierce: attacker.weapon.pierce };
    else if (attacker.weapon.enchant === WEAPON_ENCHANT.CHAIN)
        args = { chainRadius: attacker.weapon.chainRadius, chain: attacker.weapon.chain };
    else if (attacker.weapon.enchant === WEAPON_ENCHANT.SUBMACHINEGUN)
        angle += (Math.random() >= 0.5 ? 1 : -1) * (Math.random() * (attacker.weapon.dispersion / 2)) * (Math.PI / 180);

    attacker.bullets.push(createBullet(attacker.x, attacker.y, attacker.weapon.bulletWidth, angle, attacker.weapon.damage, attacker.weapon.range, attacker.weapon.enchant, args));
    attacker.weapon.cooldownTime = attacker.weapon.cooldown;
}

export function enchantWeapon(weapon, enchant) {
    if (!enchant.support.includes(weapon.type)) return;

    weapon.enchant = enchant.name;
    for (const prop of enchant.bonusProps) {
        weapon[prop] = parseFloat(((weapon[prop] * enchant[prop] / 100)).toFixed(2));
    }

    for (const prop of enchant.props) {
        weapon[prop] = enchant[prop];
    }
}