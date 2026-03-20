import { createWeapon, tryAttack, WEAPON_TYPE, WEAPON_ENCHANT } from '../weapon.js';
import { TEAM } from '../world.js';

const PLAYER_IFRAME_DURATION = 0.45;

export function createPlayer(canvasWidth, canvasHeight) {
    return {
        isActor: true,
        team: TEAM.PLAYER,
        targetable: true,
        persistent: false,
        drawType: 'player',
        score: 0,

        x: canvasWidth / 2,
        y: canvasHeight / 2,
        radius: 16,
        angle: 0,

        hp: 100,
        maxHp: 100,
        speed: 180,

        weapon: undefined,
        items: [],

        iFramesTime: 0,
        dead: false,

        update(dt, world, inputState) {
            if (this.iFramesTime > 0) this.iFramesTime -= Math.min(dt, this.iFramesTime);
            this._move(dt, inputState);
            this._faceNearestEnemy(world);
            tryAttack(this.weapon, this, world, dt, inputState);
        },

        _move(dt, input) {
            const dirX = input.keys.left ? -1 : input.keys.right ? 1 : 0;
            const dirY = input.keys.up ? -1 : input.keys.down ? 1 : 0;
            const len = Math.hypot(dirX, dirY);
            if (len > 0) {
                this.x += (dirX / len) * this.speed * dt;
                this.y += (dirY / len) * this.speed * dt;
            }
        },

        _faceNearestEnemy(world) {
            const nearest = world.nearestActor(this.x, this.y, TEAM.ENEMY);
            if (nearest) {
                this.angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
            }
        },

        takeDamage(amount) {
            if (this.iFramesTime > 0) return;
            this.hp -= Math.min(amount, this.hp);
            this.iFramesTime = PLAYER_IFRAME_DURATION;
            if (this.weapon?.enchant === WEAPON_ENCHANT.MOMENTUM) {
                this.weapon.stacks = 0;
                this.weapon.decayTime = 0;
            }
        },

        heal(amount) {
            this.hp = Math.min(this.maxHp, this.hp + amount);
        },

        increaseMaxHp(percent) {
            const lifePercent = this.hp / this.maxHp;
            this.maxHp = Math.round(this.maxHp * (1 + percent / 100));
            this.hp = Math.round(this.maxHp * lifePercent);
        },

        equipWeapon(weapon) {
            this.weapon = weapon;
        },

        onDeath() { },
        draw() { },
    };
}