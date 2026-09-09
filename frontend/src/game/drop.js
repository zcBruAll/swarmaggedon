import { TEAM } from "./world";

export const DROP_TYPE = {
    HEAL: 'heal',
    DAMAGE: 'damage',
    GRENADE: 'grenade',
};

export const DROP_DEFS = {
    [DROP_TYPE.HEAL]: {
        id: DROP_TYPE.HEAL,
        name: 'Heal Potion',
        icon: null,
        color: '#27ae60',
        weight: 55,
        healPercent: 0.20,
    },
    [DROP_TYPE.DAMAGE]: {
        id: DROP_TYPE.DAMAGE,
        name: 'Damage Potion',
        icon: null,
        color: '#f1c40f',
        weight: 30,
        multiplier: 2,
        duration: 8,
    },
    [DROP_TYPE.GRENADE]: {
        id: DROP_TYPE.GRENADE,
        name: 'Grenade',
        icon: null,
        color: '#e67e22',
        weight: 15,
        interval: 3,     // seconds between auto-throws
        radius: 130,     // blast radius
        damage: 70,      // blast damage
        maxCharges: 3,   // stack cap
    },
}

const BASE_DROP_CHANCE = {
    runner: 0.05,
    brute: 0.10,
    shooter: 0.10,
    boss: 1.0,
};

const PICKUP_RADIUS = 16;
const MAGNET_RADIUS = 90;
const MAGNET_SPEED = 260;
const MAX_ITEM_SLOTS = 6;


function rollDropType() {
    const entries = Object.values(DROP_DEFS);
    const total = entries.reduce((s, d) => s + d.weight, 0);
    let r = Math.random() * total;
    for (const def of entries) {
        if (r < def.weight) return def.id;
        r -= def.weight;
    }
    return entries[0].id;
}

export function maybeDropLoot(enemy, world) {
    const chance = BASE_DROP_CHANCE[enemy.type] ?? 0.05;
    if (Math.random() > chance) return;

    world.spawnActor(createDrop(enemy.x, enemy.y, rollDropType()));

    if (enemy.type === 'boss') {
        world.spawnActor(createDrop(enemy.x + 20, enemy.y + 20, rollDropType()));
    }
}

export function createDrop(x, y, type) {
    const def = DROP_DEFS[type];

    return {
        isActor: true,
        team: null,
        targetable: false,
        persistent: false,
        drawType: 'pickup',
        score: 0,

        dropType: type,
        icon: def.icon,
        color: def.color,

        x, y,
        radius: 9,
        angle: 0,
        dead: false,

        bobTime: Math.random() * Math.PI * 2,
        lifeTime: 0,
        maxLifeTime: 20,

        update(dt, world) {
            this.bobTime += dt * 3;
            this.lifeTime += dt;
            if (this.lifeTime > this.maxLifeTime) { this.dead = true; return; }

            const target = world.nearestActor(this.x, this.y, TEAM.PLAYER);
            if (!target) return;

            const dist = Math.hypot(target.x - this.x, target.y - this.y);

            if (dist <= this.radius + PICKUP_RADIUS) {
                applyDropEffect(this.dropType, target, world);
                this.dead = true;
                return;
            }

            if (dist <= MAGNET_RADIUS) {
                const pull = Math.min(MAGNET_SPEED * dt, dist);
                this.x += (target.x - this.x) / dist * pull;
                this.y += (target.y - this.y) / dist * pull;
            }
        },

        onDeath() { },
        draw() { },
    };
}

function addOrStackItem(actor, item) {
    const existing = actor.items.find(i => i.id === item.id);
    if (existing) {
        existing.charges = Math.min((existing.charges ?? 1) + 1, item.maxCharges ?? 99);
        return;
    }
    if (actor.items.length >= MAX_ITEM_SLOTS) return;
    actor.items.push(item);
}

export function applyDropEffect(type, actor, world) {
    const def = DROP_DEFS[type];

    switch (type) {
        case DROP_TYPE.HEAL: {
            actor.heal(Math.round(actor.maxHp * def.healPercent));
            break;
        }
        case DROP_TYPE.DAMAGE: {
            const existing = actor.items.find(i => i.id === DROP_TYPE.DAMAGE);
            if (existing) {
                existing.cooldownTime = existing.cooldown;
            } else {
                actor.items.push({
                    id: DROP_TYPE.DAMAGE,
                    name: def.name,
                    icon: def.icon,
                    kind: 'buff',
                    cooldown: def.duration,
                    cooldownTime: def.duration,
                    multiplier: def.multiplier,
                });
            }
            break;
        }
        case DROP_TYPE.GRENADE: {
            addOrStackItem(actor, {
                id: DROP_TYPE.GRENADE,
                name: def.name,
                icon: def.icon,
                kind: 'active',
                cooldown: def.interval,
                cooldownTime: def.interval,
                charges: 1,
                maxCharges: def.maxCharges,
                radius: def.radius,
                damage: def.damage,
            });
            break;
        }
        default: break;
    }
}

function _triggerActiveItem(item, actor, world) {
    if (item.id === DROP_TYPE.GRENADE) {
        const target = world.nearestActor(actor.x, actor.y, TEAM.ENEMY);
        if (!target) return false;
        world.aoeBlast(target.x, target.y, item.radius, item.damage, TEAM.ENEMY, null);
        return true;
    }
    return false;
}

/** Call this once per frame for any actor that can hold items (player, engineer). */
export function tickItems(actor, dt, world) {
    if (!actor.items) actor.items = [];
    let multiplier = 1;

    for (let i = actor.items.length - 1; i >= 0; i--) {
        const item = actor.items[i];

        if (item.kind === 'buff') {
            item.cooldownTime -= Math.min(dt, item.cooldownTime);
            if (item.cooldownTime <= 0) { actor.items.splice(i, 1); continue; }
            if (item.id === DROP_TYPE.DAMAGE) multiplier *= item.multiplier;
        }

        if (item.kind === 'active') {
            item.cooldownTime -= Math.min(dt, item.cooldownTime);
            if (item.cooldownTime <= 0) {
                const triggered = _triggerActiveItem(item, actor, world);
                if (triggered) item.charges -= 1;
                item.cooldownTime = item.cooldown;
                if (item.charges <= 0) actor.items.splice(i, 1);
            }
        }
    }

    actor.damageMultiplier = multiplier;
}