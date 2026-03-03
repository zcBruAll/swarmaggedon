import { equipWeapon, increaseMaxHp } from "./player.js";
import { createWeapon, WEAPON_ACTION, WEAPON_TYPE } from "./weapon.js";

export const CHOICE_TYPE = {
    AUGMENT: 'augment',
    WEAPON: 'weapon',
    ITEM: 'item',
}

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const RARITIES = {
    COMMON: { name: 'Common', color: '#bdc3c7', weight: 60, mult: 1.0 },
    RARE: { name: 'Rare', color: '#3498db', weight: 30, mult: 1.5 },
    EPIC: { name: 'Epic', color: '#9b59b6', weight: 8, mult: 2.0 },
    LEGENDARY: { name: 'Legendary', color: '#f1c40f', weight: 2, mult: 3.0 }
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
            getCurr: (arg) => arg.cooldownTime,
            getNew: (arg, b) => (arg.cooldownTime * (1 + b / 100)).toFixed(2),
            func: (wpn, b) => { wpn.cooldownTime = (wpn.cooldownTime * (1 + b / 100)).toFixed(2); },
        },
    ];

    if (player.weapon.type === WEAPON_TYPE.RANGE) {
        if (player.weapon.action === WEAPON_ACTION.AOE) {
            possibleChoices.push({
                attr: "AOE Radius",
                getBonus: (mult) => rand(5 * mult, 10 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.aoeRadius,
                getNew: (arg, b) => Math.round(arg.aoeRadius * (1 + b / 100)),
                func: (wpn, b) => { wpn.aoeRadius = Math.round(wpn.aoeRadius * (1 + b / 100)); },
            });
        } else if (player.weapon.action === WEAPON_ACTION.PIERCE) {
            possibleChoices.push({
                attr: "Pierce",
                getBonus: (mult) => rand(5 * mult, 10 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.pierce,
                getNew: (arg, b) => (arg.pierce * (1 + b / 100)).toFixed(2),
                func: (wpn, b) => { wpn.pierce = (wpn.pierce * (1 + b / 100)).toFixed(2); },
            });
        } else if (player.weapon.action === WEAPON_ACTION.RIFLE) {
            possibleChoices.push({
                attr: "Rifle",
                getBonus: (mult) => rand(5 * mult, 10 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.rifle,
                getNew: (arg, b) => (arg.rifle * (1 + b / 100)).toFixed(2),
                func: (wpn, b) => { wpn.rifle = (wpn.rifle * (1 + b / 100)).toFixed(2); },
            });
        } else if (player.weapon.action === WEAPON_ACTION.TRANSFER) {
            possibleChoices.push({
                attr: "Transfer Radius",
                getBonus: (mult) => rand(5 * mult, 10 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.transferRadius,
                getNew: (arg, b) => (arg.transferRadius * (1 + b / 100)).toFixed(2),
                func: (wpn, b) => { wpn.transferRadius = (wpn.transferRadius * (1 + b / 100)).toFixed(2); },
            });
            possibleChoices.push({
                attr: "Transfer time",
                getBonus: (mult) => rand(5 * mult, 10 * mult),
                arg: player.weapon,
                getCurr: (arg) => arg.transferTime,
                getNew: (arg, b) => (arg.transferTime * (1 + b / 100)).toFixed(2),
                func: (wpn, b) => { wpn.transferTime = (wpn.transferRadius * (1 + b / 100)).toFixed(2); },
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

export function getWeaponChoices(wave, player) {
    let possibleChoices = wave > 0 ? [player.weapon] : [];

    Object.values(WEAPON_TYPE).forEach(type => {
        if (wave > 0) {
            Object.values(WEAPON_ACTION).forEach(action => {
                let weapon = createWeapon(type, action);
                possibleChoices.push(weapon);
            });
        }
        possibleChoices.push(createWeapon(type, undefined));
    });

    let rarity;
    if (wave <= 0) {
        rarity = RARITIES.COMMON;
    } else {
        rarity = getRandomRarity();
    }

    const choices = possibleChoices
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((wpn, index) => {
            return {
                id: index,
                attr: wpn.type + ' · ' + wpn.action ?? '',
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