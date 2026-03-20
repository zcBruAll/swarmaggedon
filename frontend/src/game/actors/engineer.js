import { TEAM } from '../world.js';
import { WEAPON_TYPE, WEAPON_ENCHANT } from '../weapon.js';
import { createDrone, DRONE_STATE, DRONE_ORBIT_RADIUS, DRONE_REPAIR_RADIUS, tickOrbitPhase } from './drone.js';

const DRONE_LOADOUTS = [
    { type: WEAPON_TYPE.RANGE, enchant: WEAPON_ENCHANT.SINGLE },
    { type: WEAPON_TYPE.MELEE, enchant: WEAPON_ENCHANT.SINGLE },
    { type: WEAPON_TYPE.RANGE, enchant: WEAPON_ENCHANT.SINGLE },
    { type: WEAPON_TYPE.MELEE, enchant: WEAPON_ENCHANT.SINGLE },
];

export function createEngineer(canvasWidth, canvasHeight) {
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;

    const drones = DRONE_LOADOUTS.map((loadout, i) => {
        const d = createDrone(i, loadout.type, loadout.enchant);
        d.state = DRONE_STATE.ORBITING;
        d.x = cx;
        d.y = cy;
        return d;
    });

    return {
        isActor: true,
        team: TEAM.PLAYER,
        targetable: true,
        persistent: false,
        drawType: 'engineer',
        score: 0,

        x: cx, y: cy,
        radius: 14,
        angle: 0,

        hp: 160,
        maxHp: 160,
        speed: 210,

        iFramesTime: 0,

        weapon: undefined,
        items: [],
        drones,
        dead: false,

        selectedDroneIndex: -1,

        update(dt, world, inputState) {
            tickOrbitPhase(dt);

            if (this.iFramesTime > 0) this.iFramesTime -= Math.min(dt, this.iFramesTime);

            this._move(dt, inputState);
            this._faceNearestEnemy(world);
            this._updateDrones(dt, world, inputState);
        },

        _move(dt, input) {
            const dx = input.keys.left ? -1 : input.keys.right ? 1 : 0;
            const dy = input.keys.up ? -1 : input.keys.down ? 1 : 0;
            const len = Math.hypot(dx, dy);
            if (len > 0) {
                this.x += (dx / len) * this.speed * dt;
                this.y += (dy / len) * this.speed * dt;
            }
        },

        _faceNearestEnemy(world) {
            const nearest = world.nearestActor(this.x, this.y, TEAM.ENEMY);
            if (nearest) this.angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
        },

        _orbitingDrones() {
            return this.drones
                .filter(d => d.state === DRONE_STATE.ORBITING)
                .sort((a, b) => a.index - b.index);
        },

        _selectedDrone() {
            if (this.selectedDroneIndex < 0) return null;
            const d = this.drones[this.selectedDroneIndex];
            return d?.state === DRONE_STATE.ORBITING ? d : null;
        },

        _updateDrones(dt, world, inputState) {
            for (const drone of this.drones) {
                drone.update(dt, world, this);
            }

            const orbiting = this._orbitingDrones();

            if (this.selectedDroneIndex !== -1 && this._selectedDrone() === null) {
                this.selectedDroneIndex = -1;
            }

            if (inputState?.tabPressed) {
                if (orbiting.length === 0) {
                    this.selectedDroneIndex = -1;
                } else {
                    const current = this._selectedDrone();
                    const currentPos = current ? orbiting.indexOf(current) : -1;
                    const nextPos = (currentPos + 1) % orbiting.length;
                    this.selectedDroneIndex = orbiting[nextPos].index;
                }
            }

            if (inputState?.mouseClicked) {
                const mx = inputState.mouse.x;
                const my = inputState.mouse.y;
                const target = this._selectedDrone() ?? orbiting[0] ?? null;
                if (target) {
                    const prevPos = orbiting.indexOf(target);
                    target.deploy(mx, my);

                    // Auto-advance to next orbiting drone after deploying
                    const remaining = this._orbitingDrones();
                    if (remaining.length > 0) {
                        const nextPos = prevPos % remaining.length;
                        this.selectedDroneIndex = remaining[nextPos].index;
                    } else {
                        this.selectedDroneIndex = -1;
                    }
                }
            }

            if (inputState?.rightMouseClicked) {
                const mx = inputState.mouse.x;
                const my = inputState.mouse.y;

                const nearWrecked = this.drones
                    .filter(d => d.state === DRONE_STATE.WRECKED)
                    .sort((a, b) =>
                        Math.hypot(a.x - this.x, a.y - this.y) -
                        Math.hypot(b.x - this.x, b.y - this.y)
                    )[0];

                if (nearWrecked &&
                    Math.hypot(nearWrecked.x - this.x, nearWrecked.y - this.y) <= DRONE_REPAIR_RADIUS * 2) {
                    nearWrecked.recall();
                    return;
                }

                const nearDeployed = this.drones
                    .filter(d => d.state === DRONE_STATE.DEPLOYED)
                    .sort((a, b) =>
                        Math.hypot(a.x - mx, a.y - my) -
                        Math.hypot(b.x - mx, b.y - my)
                    )[0];
                if (nearDeployed) nearDeployed.recall();
            }
        },

        takeDamage(amount) {
            if (this.iFramesTime > 0) return;
            this.hp -= Math.min(amount, this.hp);
            this.iFramesTime = 0.45;
        },

        heal(amount) {
            this.hp = Math.min(this.maxHp, this.hp + amount);
        },

        increaseMaxHp(percent) {
            const ratio = this.hp / this.maxHp;
            this.maxHp = Math.round(this.maxHp * (1 + percent / 100));
            this.hp = Math.round(this.maxHp * ratio);
        },

        buffDrones(stat, multiplier, droneType = null) {
            for (const drone of this.drones) {
                if (droneType && drone.weaponType !== droneType) continue;
                if (drone.weapon && drone.weapon[stat] !== undefined) {
                    drone.weapon[stat] = parseFloat((drone.weapon[stat] * multiplier).toFixed(2));
                }
            }
        },

        buffAllDrones(stat, multiplier) {
            this.buffDrones(stat, multiplier, null);
        },

        equipWeapon(_weapon) { /* engineer has no personal weapon */ },

        onDeath() { },
        draw() { },
    };
}