import { equipWeapon, increaseMaxHp } from "./player.js";
import { createEnchant, createWeapon, enchantWeapon, WEAPON_ENCHANT, WEAPON_TYPE } from "./weapon.js";

export const CHOICE_TYPE = {
    AUGMENT: 'augment',
    WEAPON: 'weapon',
    ITEM: 'item',
    ENCHANT: 'enchant',
}

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const RARITIES = {
    COMMON: { name: 'Common', color: '#bdc3c7', weight: 61, mult: 1.0 },
    RARE: { name: 'Rare', color: '#3498db', weight: 30, mult: 1.5 },
    EPIC: { name: 'Epic', color: '#9b59b6', weight: 8, mult: 2.0 },
    LEGENDARY: { name: 'Legendary', color: '#f1c40f', weight: 1, mult: 3.0 }
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

export function getChoices(wave, player) {

    let possibleChoices = [
        {
            attr: "Damage",
            getBonus: (mult) => rand(10 * mult, 17 * mult),
            arg: player.weapon,
            getCurr: (arg) => arg.damage,
            getNew: (arg, b) => Math.round(arg.damage * (1 + b / 100)),
            func: (wpn, b) => { wpn.damage = Math.round(wpn.damage * (1 + b / 100)); },
        },
        {
            attr: "Range",
            getBonus: (mult) => rand(5 * mult, 15 * mult),
            arg: player.weapon,
            getCurr: (arg) => arg.range,
            getNew: (arg, b) => Math.round(arg.range * (1 + b / 100)),
            func: (wpn, b) => { wpn.range = Math.round(wpn.range * (1 + b / 100)); },
        },
        {
            attr: "Max HP",
            getBonus: (mult) => rand(10 * mult, 15 * mult),
            arg: player,
            getCurr: (arg) => arg.maxHp,
            getNew: (arg, b) => Math.round(arg.maxHp * (1 + b / 100)),
            func: increaseMaxHp,
        },
        {
            attr: "Move Speed",
            getBonus: (mult) => rand(5 * mult, 12 * mult),
            arg: player,
            getCurr: (arg) => arg.speed,
            getNew: (arg, b) => Math.round(arg.speed * (1 + b / 100)),
            func: (p, b) => { p.speed = Math.round(p.speed * (1 + b / 100)); },
        },
        {
            attr: "Cooldown",
            getBonus: (mult) => -1 * rand(5 * mult, 10 * mult),
            arg: player.weapon,
            getCurr: (arg) => arg.cooldown,
            getNew: (arg, b) => (arg.cooldown * (1 + b / 100)).toFixed(2),
            func: (wpn, b) => { wpn.cooldown = parseFloat((wpn.cooldown * (1 + b / 100)).toFixed(2)); },
        },
    ];

    if (player.weapon.type === WEAPON_TYPE.RANGE) {
        if (player.weapon.enchant !== WEAPON_ENCHANT.LASER) {
            possibleChoices.push({
                attr: "Bullet speed",
                getBonus: (mult) => rand(1 * mult, 5 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.bulletSpeed,
                getNew: (arg, b) => Math.round(arg.bulletSpeed * (1 + b / 100)),
                func: (wpn, b) => { wpn.bulletSpeed = Math.round(wpn.bulletSpeed * (1 + b / 100)); },
            });
        }
        if (player.weapon.enchant === WEAPON_ENCHANT.AOE) {
            possibleChoices.push({
                attr: "AOE Radius",
                getBonus: (mult) => rand(5 * mult, 10 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.aoeRadius,
                getNew: (arg, b) => Math.round(arg.aoeRadius * (1 + b / 100)),
                func: (wpn, b) => { wpn.aoeRadius = Math.round(wpn.aoeRadius * (1 + b / 100)); },
            });
        } else if (player.weapon.enchant === WEAPON_ENCHANT.PIERCE) {
            possibleChoices.push({
                attr: "Pierce",
                getBonus: (mult) => rand(5 * mult, 10 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.pierce,
                getNew: (arg, b) => (arg.pierce * (1 + b / 100)).toFixed(2),
                func: (wpn, b) => { wpn.pierce = parseFloat((wpn.pierce * (1 + b / 100)).toFixed(2)); },
            });
        } else if (player.weapon.enchant === WEAPON_ENCHANT.RIFLE) {
            possibleChoices.push({
                attr: "Rifle",
                getBonus: (mult) => rand(5 * mult, 10 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.rifle,
                getNew: (arg, b) => (arg.rifle * (1 + b / 100)).toFixed(2),
                func: (wpn, b) => { wpn.rifle = parseFloat((wpn.rifle * (1 + b / 100)).toFixed(2)); },
            });
        } else if (player.weapon.enchant === WEAPON_ENCHANT.CHAIN) {
            possibleChoices.push({
                attr: "Chain Radius",
                getBonus: (mult) => rand(5 * mult, 10 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.chainRadius,
                getNew: (arg, b) => (arg.chainRadius * (1 + b / 100)).toFixed(2),
                func: (wpn, b) => { wpn.chainRadius = parseFloat((wpn.chainRadius * (1 + b / 100)).toFixed(2)); },
            });
            possibleChoices.push({
                attr: "Chain",
                getBonus: (mult) => rand(5 * mult, 10 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.chain,
                getNew: (arg, b) => (arg.chain * (1 + b / 100)).toFixed(2),
                func: (wpn, b) => { wpn.chain = parseFloat((wpn.chain * (1 + b / 100)).toFixed(2)); },
            });
        } else if (player.weapon.enchant === WEAPON_ENCHANT.LASER) {
            possibleChoices.push({
                attr: "Laser width",
                getBonus: (mult) => rand(1 * mult, 5 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.bulletWidth,
                getNew: (arg, b) => (arg.bulletWidth * (1 + b / 100)).toFixed(2),
                func: (wpn, b) => { wpn.bulletWidth = parseFloat((wpn.bulletWidth * (1 + b / 100)).toFixed(2)); },
            });
            possibleChoices.push({
                attr: "Laser cooldown",
                getBonus: (mult) => rand(2 * mult, 7 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.laserCd,
                getNew: (arg, b) => (arg.laserCd * (1 - b / 100)).toFixed(2),
                func: (wpn, b) => { wpn.laserCd = parseFloat((wpn.laserCd * (1 - b / 100)).toFixed(2)); },
            });
        }
    } else if (player.weapon.type === WEAPON_TYPE.MELEE) {
        if (player.weapon.enchant === WEAPON_ENCHANT.LIFESTEAL) {
            possibleChoices.push({
                attr: "Lifesteal",
                getBonus: (mult) => rand(2 * mult, 7 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.lifesteal,
                getNew: (arg, b) => (arg.lifesteal * (1 + b / 100)).toFixed(2),
                func: (wpn, b) => { wpn.lifesteal = parseFloat((wpn.lifesteal * (1 + b / 100)).toFixed(2)); },
            });
        } else if (player.weapon.enchant === WEAPON_ENCHANT.CHARGE) {
            possibleChoices.push({
                attr: "Damage Speed",
                getBonus: (mult) => rand(5 * mult, 10 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.dmgSpeed,
                getNew: (arg, b) => (arg.dmgSpeed * (1 + b / 100)).toFixed(2),
                func: (wpn, b) => { wpn.dmgSpeed = parseFloat((wpn.dmgSpeed * (1 + b / 100)).toFixed(2)); },
            });
            possibleChoices.push({
                attr: "Range Speed",
                getBonus: (mult) => rand(5 * mult, 10 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.rngSpeed,
                getNew: (arg, b) => (arg.rngSpeed * (1 + b / 100)).toFixed(2),
                func: (wpn, b) => { wpn.rngSpeed = parseFloat((wpn.rngSpeed * (1 + b / 100)).toFixed(2)); },
            });
            possibleChoices.push({
                attr: "Max charge",
                getBonus: (mult) => rand(2 * mult, 7 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.maxCharge,
                getNew: (arg, b) => (arg.maxCharge * (1 + b / 100)).toFixed(2),
                func: (wpn, b) => { wpn.maxCharge = parseFloat((wpn.maxCharge * (1 + b / 100)).toFixed(2)); },
            });
        }
    }

    const choices = possibleChoices
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((choice, index) => {
            const rarity = getRandomRarity();
            const bonus = choice.getBonus(rarity.mult);

            const currentVal = choice.getCurr(choice.arg);
            const newVal = choice.getNew(choice.arg, bonus);

            return {
                id: index,
                attr: choice.attr,
                bonus: bonus,
                rarityName: rarity.name,
                rarityColor: rarity.color,
                curr: currentVal,
                new: newVal,
                type: CHOICE_TYPE.AUGMENT,
                arg: choice.arg,
                func: choice.func
            };
        });

    return choices;
}

export function getEnchantChoices(wave, player) {
    let possibleChoices = [];

    Object.values(WEAPON_ENCHANT).forEach(enchant_type => {
        if (enchant_type !== player.weapon.enchant) {
            let enchant = createEnchant(enchant_type);
            if (enchant.support.includes(player.weapon.type))
                possibleChoices.push(enchant);
        }
    });

    const choices = possibleChoices
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((enchant, index) => {
            const rarity = RARITIES.EPIC;//getRandomRarity();
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

    return choices;
}

export function getWeaponChoices(wave, player) {
    let possibleChoices = wave > 0 ? [player.weapon] : [];

    Object.values(WEAPON_TYPE).forEach(type => {
        if (wave > 0) {
            Object.values(WEAPON_ENCHANT).forEach(enchant => {
                let weapon = createWeapon(type, enchant);
                possibleChoices.push(weapon);
            });
        } else {
            possibleChoices.push(createWeapon(type, undefined));
        }
    });

    const choices = possibleChoices
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((wpn, index) => {
            let rarity;
            if (wave <= 0) {
                rarity = RARITIES.COMMON;
            } else {
                rarity = getRandomRarity();
            }

            return {
                id: index,
                attr: wpn.type + ' · ' + wpn.enchant ?? '',
                wpn,
                rarityName: rarity.name,
                rarityColor: rarity.color,
                type: CHOICE_TYPE.WEAPON,
                arg: player,
                func: equipWeapon,
            };
        });

    return choices;
}