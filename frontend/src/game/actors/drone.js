import { createWeapon, tryAttack } from '../weapon.js';
import { TEAM } from '../world.js';

export const DRONE_STATE = {
    STASH: 'stash',
    ORBITING: 'orbiting',
    DEPLOYED: 'deployed',
    WRECKED: 'wrecked',
    RECALLING: 'recalling',
};

export const DRONE_ORBIT_RADIUS = 60;
export const DRONE_REPAIR_RADIUS = 55;
export const DRONE_REPAIR_TIME = 2.5;
export const FIELD_REPAIR_RATE = 8;
const ORBIT_REPAIR_RATE = 4;
const ORBIT_SPEED = 2.0;
const ORBIT_SPREAD = Math.PI * 2;
const RECALL_SPEED = 320;
const DEPLOY_PAUSE = 0.25;

const ORBIT_DAMAGE_MULT = 0.35;
const ORBIT_RANGE_MULT = 0.55;
const ORBIT_COOLDOWN_MULT = 1.80;

export function createDrone(index, weaponType, enchant = undefined) {
    const weapon = createWeapon(weaponType, enchant);
    weapon.damage = parseFloat((weapon.damage * 0.80).toFixed(2));
    weapon.cooldown = parseFloat((weapon.cooldown * 1.10).toFixed(2));
    weapon.cooldownTime = weapon.cooldown;

    return {
        isActor: true,
        team: TEAM.PLAYER,
        targetable: true,
        persistent: false,
        drawType: 'drone',
        score: 0,

        index,
        weapon,
        weaponType,

        x: 0, y: 0,
        radius: 10,
        angle: 0,

        state: DRONE_STATE.STASH,
        hp: 80,
        maxHp: 80,
        dead: false,

        orbitAngle: (index / 4) * Math.PI * 2,
        repairProgress: 0,
        _deployTimer: 0,

        update(dt, world, player) {
            switch (this.state) {
                case DRONE_STATE.STASH: return;
                case DRONE_STATE.ORBITING: this._updateOrbiting(dt, world, player); break;
                case DRONE_STATE.DEPLOYED: this._updateDeployed(dt, world, player); break;
                case DRONE_STATE.WRECKED: this._updateWrecked(dt, player); break;
                case DRONE_STATE.RECALLING: this._updateRecalling(dt, player); break;
            }
        },

        _updateOrbiting(dt, world, player) {
            this.orbitAngle += ORBIT_SPEED * dt;

            const offset = this.index * (ORBIT_SPREAD / 4);
            const a = this.orbitAngle + offset;
            this.x = player.x + Math.cos(a) * DRONE_ORBIT_RADIUS;
            this.y = player.y + Math.sin(a) * DRONE_ORBIT_RADIUS;

            const nearest = world.nearestActor(this.x, this.y, TEAM.ENEMY);
            this.angle = nearest
                ? Math.atan2(nearest.y - this.y, nearest.x - this.x)
                : a + Math.PI / 2;

            const savedDamage = this.weapon.damage;
            const savedRange = this.weapon.range;
            const savedCooldown = this.weapon.cooldown;
            this.weapon.damage = savedDamage * ORBIT_DAMAGE_MULT;
            this.weapon.range = savedRange * ORBIT_RANGE_MULT;
            this.weapon.cooldown = savedCooldown * ORBIT_COOLDOWN_MULT;
            tryAttack(this.weapon, this, world, dt);
            this.weapon.damage = savedDamage;
            this.weapon.range = savedRange;
            this.weapon.cooldown = savedCooldown;

            if (this.hp < this.maxHp) {
                this.hp = Math.min(this.maxHp, this.hp + ORBIT_REPAIR_RATE * dt);
            }
        },

        _updateDeployed(dt, world, player) {
            if (this._deployTimer > 0) {
                this._deployTimer -= dt;
                return;
            }

            const target = world.nearestActor(this.x, this.y, TEAM.ENEMY);
            if (target) {
                this.angle = Math.atan2(target.y - this.y, target.x - this.x);
            }
            tryAttack(this.weapon, this, world, dt);

            if (this.hp < this.maxHp) {
                const dist = Math.hypot(player.x - this.x, player.y - this.y);
                if (dist <= DRONE_REPAIR_RADIUS) {
                    this.hp = Math.min(this.maxHp, this.hp + FIELD_REPAIR_RATE * dt);
                }
            }
        },

        _updateWrecked(dt, player) {
            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            if (dist <= DRONE_REPAIR_RADIUS) {
                this.repairProgress += dt / DRONE_REPAIR_TIME;
                if (this.repairProgress >= 1) {
                    this.repairProgress = 0;
                    this.hp = this.maxHp;
                    this.state = DRONE_STATE.RECALLING;
                }
            } else {
                this.repairProgress = Math.max(0, this.repairProgress - dt * 0.10);
            }
        },

        _updateRecalling(dt, player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);

            if (dist <= DRONE_ORBIT_RADIUS + 8) {
                this.state = DRONE_STATE.ORBITING;
                this.orbitAngle = Math.atan2(this.y - player.y, this.x - player.x);
                return;
            }

            const move = Math.min(RECALL_SPEED * dt, dist);
            this.x += (dx / dist) * move;
            this.y += (dy / dist) * move;
            this.angle = Math.atan2(dy, dx);
        },

        deploy(wx, wy) {
            if (this.state !== DRONE_STATE.ORBITING) return false;
            this.x = wx;
            this.y = wy;
            this.state = DRONE_STATE.DEPLOYED;
            this._deployTimer = DEPLOY_PAUSE;
            this.weapon.cooldownTime = 0;
            return true;
        },

        recall() {
            if (this.state !== DRONE_STATE.DEPLOYED &&
                this.state !== DRONE_STATE.ORBITING) return false;
            this.state = DRONE_STATE.RECALLING;
            return true;
        },

        takeDamage(amount) {
            const mult = this.state === DRONE_STATE.ORBITING ? 0.65 : 1;
            this.hp -= Math.min(amount * mult, this.hp);
            if (this.hp <= 0) {
                this.hp = 0;
                this.state = DRONE_STATE.WRECKED;
                this.repairProgress = 0;
            }
        },

        resetForNextWave(player) {
            this.hp = this.maxHp;
            this.repairProgress = 0;
            this.weapon.cooldownTime = 0;

            switch (this.state) {
                case DRONE_STATE.DEPLOYED:
                    this.state = DRONE_STATE.RECALLING;
                    break;
                case DRONE_STATE.WRECKED:
                    this.state = DRONE_STATE.ORBITING;
                    this.x = player.x;
                    this.y = player.y;
                    this.orbitAngle = this.index * (Math.PI * 2 / 4);
                    break;
                default: break;
            }
        },

        onDeath() { },
        draw() { },
    };
}