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

export function createWeapon(type, action) {
    switch (type) {
        case WEAPON_TYPE.MELEE:
            return {
                cooldown: 0.8,
                cooldownTime: 0.8,
                damage: 20,
                type: WEAPON_TYPE.MELEE,
                action: WEAPON_ACTION.SINGLE,
                angle: 90,
                range: 65,
                props: ['angle'],
            }
        case WEAPON_TYPE.RANGE:
        default:
            switch (action) {
                case WEAPON_ACTION.RIFLE:
                    return {
                        cooldown: 2,
                        cooldownTime: 2,
                        damage: 15,
                        type: WEAPON_TYPE.RANGE,
                        action: WEAPON_ACTION.RIFLE,
                        rifle: 3,
                        burstInterval: 0.1,
                        range: 350,
                        props: ['rifle', 'burstInterval'],
                    }
                case WEAPON_ACTION.PIERCE:
                    return {
                        cooldown: 1,
                        cooldownTime: 1,
                        damage: 12,
                        type: WEAPON_TYPE.RANGE,
                        action: WEAPON_ACTION.PIERCE,
                        pierce: 3,
                        range: 300,
                        props: ['pierce'],
                    }
                case WEAPON_ACTION.AOE:
                    return {
                        cooldown: 2,
                        cooldownTime: 2,
                        damage: 15,
                        type: WEAPON_TYPE.RANGE,
                        action: WEAPON_ACTION.AOE,
                        aoeRadius: 150,
                        range: 300,
                        props: ['aoeRadius'],
                    }
                case WEAPON_ACTION.SINGLE:
                default:
                    return {
                        cooldown: 0.6,
                        cooldownTime: 0.6,
                        damage: 15,
                        type: WEAPON_TYPE.RANGE,
                        action: WEAPON_ACTION.SINGLE,
                        range: 350,
                        props: [],
                    }
            }
    }
}


export function fireBullet(attacker, angle) {
    if (attacker.weapon.action === WEAPON_ACTION.RIFLE) {
        attacker.weapon.bulletsToFire = attacker.weapon.rifle - 1;
        attacker.weapon.burstAngle = angle;
        attacker.weapon.nextBurstTime = attacker.weapon.burstInterval;
    }
    let args;
    if (attacker.weapon.action === WEAPON_ACTION.AOE)
        args = { aoeRadius: attacker.weapon.aoeRadius };
    else if (attacker.weapon.action === WEAPON_ACTION.PIERCE)
        args = { pierce: attacker.weapon.pierce };
    else if (attacker.weapon.action === WEAPON_ACTION.TRANSFER)
        args = { transferRadius: attacker.weapon.transferRadius, transfer: attacker.weapon.transfer };
    attacker.bullets.push(createBullet(attacker.x, attacker.y, angle, attacker.weapon.damage, attacker.weapon.range, attacker.weapon.action, args));
    attacker.weapon.cooldown = attacker.weapon.cooldownTime;
}