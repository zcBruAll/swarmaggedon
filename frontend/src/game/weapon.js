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
        damage: 10,
        type: WEAPON_TYPE.RANGE,
        action: WEAPON_ACTION.AUTO,
        range: 350,
    }
}

export function fireBullet(player) {
    player.bullets.push(createBullet(player.x, player.y, player.angle));
    player.weapon.cooldown = player.weapon.cooldownTime;
}

export function createWeapon() {
    return Math.random() >= 0.5 ? createMeeleWeapon() : createRangeWeapon();
}