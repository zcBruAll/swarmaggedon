import { createEnchant, createWeapon, enchantWeapon, WEAPON_ENCHANT, WEAPON_TYPE } from './weapon.js';

export const CHOICE_TYPE = {
    AUGMENT: 'augment',
    WEAPON: 'weapon',
    ITEM: 'item',
    ENCHANT: 'enchant',
}

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const RARITIES = {
    COMMON: { name: 'Common', color: '#bdc3c7', weight: 75 },
    RARE: { name: 'Rare', color: '#3498db', weight: 22.34 },
    EPIC: { name: 'Epic', color: '#9b59b6', weight: 2.5 },
    LEGENDARY: { name: 'Legendary', color: '#f1c40f', weight: 0.16 }
};

function getRandomRarity() {
    const totalWeight = Object.values(RARITIES).reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;

    for (const key in RARITIES) {
        if (random < RARITIES[key].weight) return RARITIES[key];
        random -= RARITIES[key].weight;
    }
    return RARITIES.COMMON;
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
    const wpn = player.weapon;

    let possibleChoices = [
        {
            attr: 'Max HP',
            getBonus: (r) => getTieredBonus(10, 15, r.name),
            arg: player, getCurr: (a) => a.maxHp,
            getNew: (a, b) => Math.round(a.maxHp * (1 + b / 100)),
            func: (a, b) => a.increaseMaxHp(b),
        },
    ];

    possibleChoices.push(_pct('Damage', wpn, 'damage', 10, 15));
    possibleChoices.push(_pct('Range', wpn, 'range', 5, 15));
    possibleChoices.push(_pct('Move Speed', player, 'speed', 5, 12));
    possibleChoices.push(_pct('Cooldown', wpn, 'cooldown', -10, -5));

    if (wpn?.type === WEAPON_TYPE.RANGE) {
        if (wpn.enchant !== WEAPON_ENCHANT.LASER) {
            possibleChoices.push(_pct('Bullet Speed', wpn, 'bulletSpeed', 2, 6));
        }
        if (wpn.enchant === WEAPON_ENCHANT.AOE)
            possibleChoices.push(_pct('AOE Radius', wpn, 'aoeRadius', 5, 10));
        if (wpn.enchant === WEAPON_ENCHANT.PIERCE)
            possibleChoices.push(_pct('Pierce', wpn, 'pierce', 5, 10));
        if (wpn.enchant === WEAPON_ENCHANT.RIFLE)
            possibleChoices.push(_pct('Rifle', wpn, 'rifle', 5, 10));
        if (wpn.enchant === WEAPON_ENCHANT.CHAIN) {
            possibleChoices.push(_pct('Chain Radius', wpn, 'chainRadius', 5, 10));
            possibleChoices.push(_pct('Chain', wpn, 'chain', 5, 10));
        }
        if (wpn.enchant === WEAPON_ENCHANT.LASER) {
            possibleChoices.push(_pct('Laser Width', wpn, 'bulletWidth', 1, 5));
            possibleChoices.push(_pct('Laser Cooldown', wpn, 'laserCd', -7, -2));
        }
    } else if (wpn?.type === WEAPON_TYPE.MELEE) {
        if (wpn.enchant === WEAPON_ENCHANT.LIFESTEAL)
            possibleChoices.push(_pct('Lifesteal', wpn, 'lifesteal', 2, 7));
        if (wpn.enchant === WEAPON_ENCHANT.CHARGE) {
            possibleChoices.push(_pct('Damage Speed', wpn, 'dmgSpeed', 5, 10));
            possibleChoices.push(_pct('Range Speed', wpn, 'rngSpeed', 5, 10));
            possibleChoices.push(_pct('Max Charge', wpn, 'maxCharge', 2, 7));
        }
    }

    return _buildChoices(possibleChoices, CHOICE_TYPE.AUGMENT);
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
                attr: wpn.type + ' · ' + wpn.enchant ?? '',
                wpn,
                rarityName: rarity.name,
                rarityColor: rarity.color,
                type: CHOICE_TYPE.WEAPON,
                arg: player,
                func: (p, w) => p.equipWeapon(w),
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

function _buildChoices(possibleChoices, type) {
    return possibleChoices
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((choice, index) => {
            const rarity = getRandomRarity();
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