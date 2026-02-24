export const WEAPON_TYPE = {
    MELEE: 'melee',
    RANGE: 'range',
}

export function createWeapon() {
    return {
        cooldown: 0,
        cooldownTime: 5,
        damage: 10,
        type: WEAPON_TYPE.MELEE,
        angle: 45,
        radius: 50,
    }
}