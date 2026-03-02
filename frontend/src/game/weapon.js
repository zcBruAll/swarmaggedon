import { createBullet } from "./bullet"

export const WEAPON_TYPE = {
    MELEE: 'melee',
    RANGE: 'range',
}

export const WEAPON_ACTION = {
    SINGLE: 'single',
    AOE: 'aoe',
    RIFLE: 'rifle',
    TRANSFER: 'transfer',
    PIERCE: 'pierce',
}

export function createMeeleWeapon() {
    return {
        cooldown: 1.2,
        cooldownTime: 1.2,
        damage: 20,
        type: WEAPON_TYPE.MELEE,
        action: WEAPON_ACTION.SINGLE,
        angle: 90,
        range: 65,
    }
}

export function createRangeWeapon() {
    if (Math.random() > 0.85) {
        return {
            cooldown: 2,
            cooldownTime: 2,
            damage: 15,
            type: WEAPON_TYPE.RANGE,
            action: WEAPON_ACTION.RIFLE,
            rifle: 3,
            burstInterval: 0.1,
            range: 350,
        }
    }
    return {
        cooldown: 0.6,
        cooldownTime: 0.6,
        damage: 15,
        type: WEAPON_TYPE.RANGE,
        action: WEAPON_ACTION.SINGLE,
        range: 350,
    }
}

export function fireBullet(attacker, angle) {
    if (attacker.weapon.action === WEAPON_ACTION.RIFLE) {
        attacker.weapon.bulletsToFire = attacker.weapon.rifle - 1;
        attacker.weapon.burstAngle = angle;
        attacker.weapon.nextBurstTime = attacker.weapon.burstInterval;
    }
    attacker.bullets.push(createBullet(attacker.x, attacker.y, angle, attacker.weapon.damage, attacker.weapon.range));
    attacker.weapon.cooldown = attacker.weapon.cooldownTime;
}

export function createWeapon() {
    return Math.random() >= 0.5 ? createMeeleWeapon() : createRangeWeapon();
}