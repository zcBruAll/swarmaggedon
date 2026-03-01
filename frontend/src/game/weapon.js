import { createBullet } from "./bullet"

export const WEAPON_TYPE = {
    MELEE: 'melee',
    RANGE: 'range',
}

export const WEAPON_ACTION = {
    SINGLE: 'single',
    CHARGE: 'charge',
    RIFLE: 'rifle',
}

export function createMeeleWeapon() {
    return {
        cooldown: 1.2,
        cooldownTime: 1.2,
        damage: 20,
        type: WEAPON_TYPE.MELEE,
        action: WEAPON_ACTION.AUTO,
        angle: 90,
        range: 65,
    }
}

export function createRangeWeapon() {
    return {
        cooldown: 0.6,
        cooldownTime: 0.6,
        damage: 15,
        type: WEAPON_TYPE.RANGE,
        action: WEAPON_ACTION.AUTO,
        range: 350,
    }
}

export function fireBullet(attacker, angle) {
    attacker.bullets.push(createBullet(attacker.x, attacker.y, angle, attacker.weapon.damage));
    attacker.weapon.cooldown = attacker.weapon.cooldownTime;
}

export function createWeapon() {
    return Math.random() >= 0.5 ? createMeeleWeapon() : createRangeWeapon();
}