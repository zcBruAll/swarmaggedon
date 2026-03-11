import { TEAM } from "./world.js";

export const BULLET_EXPLOS = {
    HIT: 'hit',
    AOE: 'aoe',
    PIERCE: 'pierce',
    CHAIN: 'chain',
}

const MAX_BULLET_DIST = 900;

export function createBullet(x, y, width, angle, speed, damage, range, type = BULLET_EXPLOS.HIT, args = null, sourceTeam = TEAM.PLAYER) {
    return {
        isActor: true,
        team: sourceTeam,
        targetTeam: sourceTeam === TEAM.PLAYER ? TEAM.ENEMY : TEAM.PLAYER,
        targetable: false,
        x, y,
        hp: 1,
        dead: false,
        radius: width,
        score: 0,
        persistent: false,

        width, angle, speed, damage,
        range,
        dist: 0,
        transpierced: [],
        explos: type,
        args,

        update(dt, world) {
            if (this.dead) return;

            const stepX = Math.cos(this.angle) * this.speed * dt;
            const stepY = Math.sin(this.angle) * this.speed * dt;

            this.x += stepX;
            this.y += stepY;
            this.dist += this.speed * dt;

            if (this.dist > MAX_BULLET_DIST + this.range) {
                this.dead = true;
                return;
            }

            const targets = world.actorsOnTeam(this.targetTeam)
                .filter(a => !a.isActor || a.targetable !== false);

            for (const target of targets) {
                if (!checkHit(this, target, stepX, stepY)) continue;
                this._resolveHit(target, targets, world);
                break;
            }
        },

        _resolveHit(target, allTargets, world) {
            switch (this.explos) {
                case BULLET_EXPLOS.CHAIN: this._chainHit(target, allTargets, world); break;
                case BULLET_EXPLOS.AOE: this._aoeHit(target, world); break;
                case BULLET_EXPLOS.PIERCE: this._pierceHit(target); break;
                default:
                    target.takeDamage(this.damage, this, world);
                    this.dead = true;
                    break;
            }
        },

        _chainHit(target, allTargets, world) {
            if (target === this.chainFrom) return;
            target.takeDamage(this.damage, this, world);

            const chainRadius = this.args?.chainRadius ?? 150;
            let next = null;
            let nearestDist = Infinity;

            for (const t of allTargets) {
                if (t === target || t === this.chainFrom) continue;
                const d = Math.hypot(t.x - this.x, t.y - this.y);
                if (d < nearestDist && d < chainRadius + t.radius + this.width) {
                    nearestDist = d;
                    next = t;
                }
            }

            if (next && (this.args?.chain ?? 0) > 0) {
                this.angle = Math.atan2(next.y - this.y, next.x - this.x);
                this.args.chain = Math.floor(this.args.chain - 1);
                this.chainFrom = target;
                this.dist = 0;
            } else {
                this.dead = true;
            }
        },

        _aoeHit(target, world) {
            target.takeDamage(this.damage, this, world);
            const blastRadius = this.args?.aoeRadius ?? 150;
            world.aoeBlast(this.x, this.y, blastRadius, this.damage, this.targetTeam, target);
            this.dead = true;
        },

        _pierceHit(target) {
            if (!this.transpierced.includes(target)) {
                target.takeDamage(this.damage, this, null);
                this.transpierced.push(target);
                this.args.pierce = Math.floor(this.args.pierce - 1);
            }
            if (this.args.pierce <= 0) this.dead = true;
        },

        drawType: 'bullet',

        takeDamage() { },
        onDeath() { },
    }
}

// CCD ray-circle intersection
function checkHit(bullet, target, stepX, stepY) {
    // Previous frame position
    const prevX = bullet.x - stepX;
    const prevY = bullet.y - stepY;

    // Calculate the vector from the bullet's starting position to the enemy's center
    const fx = prevX - target.x;
    const fy = prevY - target.y;

    // Setup the quadratic equation: at² + bt + c = 0
    // 't' represents the fraction of the current frame (0.0 to 1.0) when the hit occurs.

    // 'a' is the bullet's squared speed (the squared distnace traveled this frame)
    const a = stepX * stepX + stepY * stepY;

    // 'b' evaluates the dot product to see if the bullet is moving towards or away from the enemy
    const b = 2 * (fx * stepX + fy * stepY);

    // 'c' represents the starting distance between the bullet and the enemy's edge
    // (target.radius + bullet.width) is used as the combined collision radius
    const c = fx * fx + fy * fy - (target.radius + bullet.width) * (target.radius + bullet.width);

    // Evaluate the collision result
    if (c <= 0) {
        // If c <= 0, the bullet's starting point was already inside the enemy's hitbox
        // The hit happened immediately at the exact start of the frame (t = 0)
        return true;
    } else if (a > 0) {
        // if 'a' > 0, the bullet actually moved this frame (safely preventing Divide-by-Zero)

        // Calculate the Discriminant to see if the bullet's infinite line crosses the circle
        const disc = b * b - 4 * a * c;
        if (disc >= 0) {
            // disc >= means the path does intersect the circle at some point in time
            // We use the quadratic formula to solve for 't', the exact moment of first impact
            const t = (-b - Math.sqrt(disc)) / (2 * a);

            // Ensure the collision only happened during the exact frame
            // t < 0 means it hit in the past. t > 1 means it will hit in the future
            return t >= 0 && t <= 1;
        }
    }

    // a <= 0 || disc < 0
    return false;
}