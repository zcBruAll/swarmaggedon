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
        cooldown: 2,
        cooldownTime: 2,
        damage: 5,
        type: WEAPON_TYPE.MELEE,
        action: WEAPON_ACTION.AUTO,
        angle: 45,
        range: 50,
    }
}

export function createRangeWeapon() {
    return {
        cooldown: 5,
        cooldownTime: 5,
        type: WEAPON_TYPE.RANGE,
        action: WEAPON_ACTION.AUTO,
        range: 350,
    }
}

export function fireBullet(attacker) {
    attacker.bullets.push(createBullet(attacker.x, attacker.y, attacker.angle));
    attacker.weapon.cooldown = attacker.weapon.cooldownTime;
}

export function createWeapon() {
    return Math.random() >= 0.5 ? createMeeleWeapon() : createRangeWeapon();
}