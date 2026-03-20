import { createEnchant, createWeapon, enchantWeapon, WEAPON_ENCHANT, WEAPON_TYPE } from './weapon.js';

export const CHOICE_TYPE = {
    AUGMENT: 'augment',
    WEAPON: 'weapon',
    ITEM: 'item',
    ENCHANT: 'enchant',
    BOSS_REWARD: 'boss_reward',
    ENGINEER_UPGRADE: 'engineer_upgrade',
    ENGINEER_ENCHANT: 'engineer_enchant',
}

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const RARITIES = {
    COMMON: { name: 'Common', color: '#bdc3c7', weight: 75 },
    RARE: { name: 'Rare', color: '#3498db', weight: 22.34 },
    EPIC: { name: 'Epic', color: '#9b59b6', weight: 2.5 },
    LEGENDARY: { name: 'Legendary', color: '#f1c40f', weight: 0.16 },
};

const RARITY_TIER = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

function getRandomRarity(minRarity = 'COMMON') {
    const minTier = RARITY_TIER.indexOf(minRarity.toUpperCase());
    const eligible = Object.entries(RARITIES)
        .filter(([key]) => RARITY_TIER.indexOf(key) >= minTier);
    const totalWeight = eligible.reduce((sum, [, r]) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;
    for (const [, rarity] of eligible) {
        if (random < rarity.weight) return rarity;
        random -= rarity.weight;
    }
    return eligible[0][1];
}

function getTieredBonus(baseMin, baseMax, rarityName) {
    switch (rarityName) {
        case 'Common': return rand(baseMin, baseMax);
        case 'Rare': return rand(baseMax + 1, Math.floor(baseMax * 1.8));
        case 'Epic': return rand(Math.floor(baseMax * 1.8) + 1, Math.floor(baseMax * 3.0));
        case 'Legendary': return rand(Math.floor(baseMax * 3.0) + 1, Math.floor(baseMax * 5.5));
        default: return rand(baseMin, baseMax);
    }
}

export function getChoices(wave, player) {
    return _buildAugmentChoices(wave, player, 'COMMON');
}

export function getBossRewardChoices(wave, player) {
    return _buildAugmentChoices(wave, player, 'RARE');
}

function _buildAugmentChoices(wave, player, minRarity) {
    const wpn = player.weapon;

    let possibleChoices = [
        {
            attr: 'maxHp',
            getBonus: (r) => getTieredBonus(10, 15, r.name),
            arg: player, getCurr: (a) => a.maxHp,
            getNew: (a, b) => Math.round(a.maxHp * (1 + b / 100)),
            func: (a, b) => a.increaseMaxHp(b),
        },
    ];

    possibleChoices.push(_pct('damage', wpn, 'damage', 10, 15));
    possibleChoices.push(_pct('range', wpn, 'range', 5, 15));
    possibleChoices.push(_pct('moveSpeed', player, 'speed', 5, 12));
    possibleChoices.push(_pct('cooldown', wpn, 'cooldown', -10, -5));

    if (wpn?.type === WEAPON_TYPE.RANGE) {
        if (wpn.enchant !== WEAPON_ENCHANT.LASER)
            possibleChoices.push(_pct('bulletSpeed', wpn, 'bulletSpeed', 2, 6));
        if (wpn.enchant === WEAPON_ENCHANT.AOE)
            possibleChoices.push(_pct('aoeRadius', wpn, 'aoeRadius', 5, 10));
        if (wpn.enchant === WEAPON_ENCHANT.PIERCE)
            possibleChoices.push(_pct('pierce', wpn, 'pierce', 5, 10));
        if (wpn.enchant === WEAPON_ENCHANT.RIFLE)
            possibleChoices.push(_pct('rifle', wpn, 'rifle', 5, 10));
        if (wpn.enchant === WEAPON_ENCHANT.CHAIN) {
            possibleChoices.push(_pct('chainRadius', wpn, 'chainRadius', 5, 10));
            possibleChoices.push(_pct('chain', wpn, 'chain', 5, 10));
        }
        if (wpn.enchant === WEAPON_ENCHANT.LASER) {
            possibleChoices.push(_pct('laserWidth', wpn, 'bulletWidth', 1, 5));
            possibleChoices.push(_pct('laserCooldown', wpn, 'laserCd', -7, -2));
        }
    } else if (wpn?.type === WEAPON_TYPE.MELEE) {
        if (wpn.enchant === WEAPON_ENCHANT.LIFESTEAL)
            possibleChoices.push(_pct('lifesteal', wpn, 'lifesteal', 2, 7));
        if (wpn.enchant === WEAPON_ENCHANT.CHARGE) {
            possibleChoices.push(_pct('damageSpeed', wpn, 'dmgSpeed', 5, 10));
            possibleChoices.push(_pct('rangeSpeed', wpn, 'rngSpeed', 5, 10));
            possibleChoices.push(_pct('maxCharge', wpn, 'maxCharge', 2, 7));
        }
        if (wpn.enchant === WEAPON_ENCHANT.MOMENTUM) {
            possibleChoices.push(_pct('maxStacks', wpn, 'maxStacks', 5, 10));
            possibleChoices.push(_pct('damagePerStack', wpn, 'damagePerStack', 5, 10));
            possibleChoices.push(_pct('cooldownPerStack', wpn, 'cooldownPerStack', 3, 7));
        }
        if (wpn.enchant === WEAPON_ENCHANT.DETONATOR) {
            possibleChoices.push(_pct('detonateRadius', wpn, 'detonateRadius', 5, 12));
            possibleChoices.push(_pct('detonateDamage', wpn, 'detonateDamage', 8, 15));
        }
    }

    return _buildChoices(possibleChoices, CHOICE_TYPE.AUGMENT, minRarity);
}

export function getEnchantChoices(wave, player) {
    const possibleChoices = Object.values(WEAPON_ENCHANT)
        .filter(e => e !== player.weapon?.enchant)
        .map(e => createEnchant(e))
        .filter(e => e.support.includes(player.weapon?.type));

    return possibleChoices
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((enchant, index) => {
            const isLegendary = Math.random() <= 0.01;
            const rarity = isLegendary ? RARITIES.LEGENDARY : RARITIES.EPIC;
            if (isLegendary) {
                if (enchant.damage) enchant.damage = Math.round(enchant.damage * 1.5);
                if (enchant.cooldown) enchant.cooldown = Math.round(enchant.cooldown * 0.75);
                if (enchant.range) enchant.range = Math.round(enchant.range * 1.3);
            }
            return {
                id: index,
                attr: enchant.name,
                enchant,
                rarityName: rarity.name,
                rarityColor: rarity.color,
                type: CHOICE_TYPE.ENCHANT,
                arg: player.weapon,
                func: enchantWeapon,
            };
        });
}

export function getWeaponChoices(wave, player) {
    let possibleChoices = wave > 0 ? [player.weapon] : [];
    Object.values(WEAPON_TYPE).forEach(type => {
        if (wave > 0) {
            Object.values(WEAPON_ENCHANT).forEach(enchant => {
                possibleChoices.push(createWeapon(type, enchant));
            });
        } else {
            possibleChoices.push(createWeapon(type, undefined));
        }
    });

    return possibleChoices
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((wpn, index) => {
            const rarity = wave <= 0 ? RARITIES.COMMON : getRandomRarity();
            return {
                id: index,
                attr: wpn.type,
                wpn,
                rarityName: rarity.name,
                rarityColor: rarity.color,
                type: CHOICE_TYPE.WEAPON,
                arg: player,
                func: (p, w) => p.equipWeapon(w),
            };
        });
}

export function getEngineerUpgradeChoices(wave, engineer, minRarity = 'COMMON') {
    const ranged = engineer.drones.find(d => d.weaponType === WEAPON_TYPE.RANGE)?.weapon;
    const melee = engineer.drones.find(d => d.weaponType === WEAPON_TYPE.MELEE)?.weapon;
    const anyDrone = engineer.drones[0];

    const possibleChoices = [
        {
            attr: 'maxHp',
            getBonus: (r) => getTieredBonus(10, 15, r.name),
            getCurr: () => engineer.maxHp,
            getNew: (b) => Math.round(engineer.maxHp * (1 + b / 100)),
            func: (b) => engineer.increaseMaxHp(b),
        },
        {
            attr: 'moveSpeed',
            getBonus: (r) => getTieredBonus(5, 10, r.name),
            getCurr: () => engineer.speed,
            getNew: (b) => parseFloat((engineer.speed * (1 + b / 100)).toFixed(1)),
            func: (b) => { engineer.speed = parseFloat((engineer.speed * (1 + b / 100)).toFixed(1)); },
        },
        {
            attr: 'droneHp',
            getBonus: (r) => getTieredBonus(12, 18, r.name),
            getCurr: () => anyDrone?.maxHp ?? 90,
            getNew: (b) => Math.round((anyDrone?.maxHp ?? 90) * (1 + b / 100)),
            func: (b) => {
                for (const d of engineer.drones) {
                    const ratio = d.maxHp > 0 ? d.hp / d.maxHp : 1;
                    d.maxHp = Math.round(d.maxHp * (1 + b / 100));
                    d.hp = Math.round(d.maxHp * ratio);
                }
            },
        },
        ...(ranged ? [
            { attr: 'rangeDamage', getBonus: (r) => getTieredBonus(10, 16, r.name), getCurr: () => ranged.damage, getNew: (b) => parseFloat((ranged.damage * (1 + b / 100)).toFixed(2)), func: (b) => engineer.buffDrones('damage', 1 + b / 100, WEAPON_TYPE.RANGE) },
            { attr: 'rangeFireRate', getBonus: (r) => getTieredBonus(-12, -6, r.name), getCurr: () => ranged.cooldown, getNew: (b) => parseFloat((ranged.cooldown * (1 + b / 100)).toFixed(2)), func: (b) => engineer.buffDrones('cooldown', 1 + b / 100, WEAPON_TYPE.RANGE) },
            { attr: 'rangeRange', getBonus: (r) => getTieredBonus(8, 14, r.name), getCurr: () => ranged.range, getNew: (b) => parseFloat((ranged.range * (1 + b / 100)).toFixed(1)), func: (b) => engineer.buffDrones('range', 1 + b / 100, WEAPON_TYPE.RANGE) },
        ] : []),
        ...(melee ? [
            { attr: 'meleeDamage', getBonus: (r) => getTieredBonus(10, 16, r.name), getCurr: () => melee.damage, getNew: (b) => parseFloat((melee.damage * (1 + b / 100)).toFixed(2)), func: (b) => engineer.buffDrones('damage', 1 + b / 100, WEAPON_TYPE.MELEE) },
            { attr: 'meleeFireRate', getBonus: (r) => getTieredBonus(-12, -6, r.name), getCurr: () => melee.cooldown, getNew: (b) => parseFloat((melee.cooldown * (1 + b / 100)).toFixed(2)), func: (b) => engineer.buffDrones('cooldown', 1 + b / 100, WEAPON_TYPE.MELEE) },
            { attr: 'meleeRange', getBonus: (r) => getTieredBonus(8, 14, r.name), getCurr: () => melee.range, getNew: (b) => parseFloat((melee.range * (1 + b / 100)).toFixed(1)), func: (b) => engineer.buffDrones('range', 1 + b / 100, WEAPON_TYPE.MELEE) },
        ] : []),
    ];

    return possibleChoices
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((choice, index) => {
            const rarity = getRandomRarity(minRarity);
            const bonus = choice.getBonus(rarity);
            return {
                id: index,
                attr: choice.attr,
                bonus,
                rarityName: rarity.name,
                rarityColor: rarity.color,
                curr: choice.getCurr(),
                new: choice.getNew(bonus),
                type: CHOICE_TYPE.ENGINEER_UPGRADE,
                func: choice.func,
            };
        });
}

export function getEngineerEnchantChoices(wave, engineer, enchantWave) {
    const currentEnchants = {
        [WEAPON_TYPE.RANGE]: engineer.drones.find(d => d.weaponType === WEAPON_TYPE.RANGE)?.weapon?.enchant,
        [WEAPON_TYPE.MELEE]: engineer.drones.find(d => d.weaponType === WEAPON_TYPE.MELEE)?.weapon?.enchant,
    };

    const droneTypeMeta = [
        { type: WEAPON_TYPE.RANGE, label: 'Ranged Drones', color: '#2471a3' },
        { type: WEAPON_TYPE.MELEE, label: 'Melee Drones', color: '#8e44ad' },
    ];

    let eligibleTypes = droneTypeMeta;
    if (enchantWave === 2) {
        const unenchanted = droneTypeMeta.filter(
            m => !currentEnchants[m.type] || currentEnchants[m.type] === WEAPON_ENCHANT.SINGLE
        );
        if (unenchanted.length > 0) eligibleTypes = unenchanted;
    }
    
    const pool = [];
    for (const { type, label, color } of eligibleTypes) {
        const current = currentEnchants[type];
        const available = Object.values(WEAPON_ENCHANT)
            .filter(e => e !== current && e !== WEAPON_ENCHANT.SINGLE && e !== WEAPON_ENCHANT.CHARGE)
            .map(e => createEnchant(e))
            .filter(e => e.support.includes(type));
        for (const enchant of available) {
            pool.push({ enchant, droneType: type, droneTypeLabel: label, droneColor: color });
        }
    }

    const shuffled = pool.sort(() => 0.5 - Math.random());
    const seen = new Set();
    const chosen = [];
    for (const entry of shuffled) {
        const key = `${entry.droneType}:${entry.enchant.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        chosen.push(entry);
        if (chosen.length === 3) break;
    }

    if (chosen.length < 3) {
        for (const entry of shuffled) {
            if (chosen.length >= 3) break;
            if (!chosen.includes(entry)) chosen.push(entry);
        }
    }

    return chosen.map(({ enchant, droneType, droneTypeLabel, droneColor }, index) => {
        const isLegendary = Math.random() <= 0.01;
        const rarity = isLegendary ? RARITIES.LEGENDARY : RARITIES.EPIC;
        return {
            id: index,
            attr: enchant.name,
            enchant,
            droneType,
            droneTypeLabel,
            droneColor,
            rarityName: rarity.name,
            rarityColor: rarity.color,
            type: CHOICE_TYPE.ENGINEER_ENCHANT,
            func: (eng, { enchant: e, droneType: dt }) => {
                for (const d of eng.drones) {
                    if (d.weaponType !== dt) continue;
                    enchantWeapon(d.weapon, { ...e });
                }
            },
        };
    });
}

function _pct(attr, arg, prop, baseMin, baseMax) {
    return {
        attr,
        getBonus: (r) => getTieredBonus(baseMin, baseMax, r.name),
        arg,
        getCurr: (a) => a?.[prop],
        getNew: (a, b) => parseFloat((a?.[prop] * (1 + b / 100)).toFixed(2)),
        func: (a, b) => { a[prop] = parseFloat((a?.[prop] * (1 + b / 100)).toFixed(2)); },
    };
}

function _buildChoices(possibleChoices, type, minRarity = 'COMMON') {
    return possibleChoices
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((choice, index) => {
            const rarity = getRandomRarity(minRarity);
            const bonus = choice.getBonus(rarity);
            return {
                id: index,
                attr: choice.attr,
                bonus,
                rarityName: rarity.name,
                rarityColor: rarity.color,
                curr: choice.getCurr(choice.arg),
                new: choice.getNew(choice.arg, bonus),
                type,
                arg: choice.arg,
                func: choice.func,
            };
        });
}