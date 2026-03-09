import { damageEnemy } from "./enemies.js";

export const BULLET_EXPLOS = {
    HIT: 'hit',
    AOE: 'aoe',
    PIERCE: 'pierce',
    CHAIN: 'chain',
}

export function createBullet(x, y, width, angle, speed, damage, range, type = BULLET_EXPLOS.HIT, args = null) {
    return {
        x,
        y,
        width,
        angle,
        speed,
        damage,
        range,
        transpierced: [],
        explos: type,
        args,
    }
}

const MAX_BULLET_DIST = 900;

export function updateBullets(bullets, targets, dt) {
    for (const bullet of bullets) {
        if (!bullet.dead) {
            updateBullet(bullet, targets, dt);
        }
    }

    let w = 0;
    for (let r = 0; r < bullets.length; r++) {
        if (!bullets[r].dead) {
            bullets[w++] = bullets[r];
        }
    }
    bullets.length = w;
}

export function updateBullet(bullet, targets, dt) {
    bullet.x = bullet.x + Math.cos(bullet.angle) * bullet.speed * dt;
    bullet.y = bullet.y + Math.sin(bullet.angle) * bullet.speed * dt;

    bullet.dist = (bullet.dist ?? 0) + bullet.speed * dt;
    if (bullet.dist > MAX_BULLET_DIST + bullet.range) {
        bullet.dead = true;
        return;
    }

    for (const target of targets) {
        // Continuous Collision Detection (CCD) via Ray-Circle Intersection
        // We treat the bullet's movement this frame as a line segment (a ray)
        // and check exactly when it mathematically intersects the enemy's circular hitbox

        // Current / new frame position
        const stepX = Math.cos(bullet.angle) * bullet.speed * dt;
        const stepY = Math.sin(bullet.angle) * bullet.speed * dt;

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

        let hit = false;
        // Evaluate the collision result
        if (c <= 0) {
            // If c <= 0, the bullet's starting point was already inside the enemy's hitbox
            // The hit happeneed immediately at the exact start of the frame (t = 0)
            hit = true;
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
                hit = t >= 0 && t <= 1;
            }
        }

        if (hit) {
            if (bullet.explos === BULLET_EXPLOS.CHAIN) {
                if (target === bullet.chainFrom) continue;
                damageEnemy(target, bullet.damage);

                let nextTarget = null;
                let nearestTargetDist = 1e6;
                const chainRadius = bullet.args.chainRadius || 150;

                for (const chainTarget of targets) {
                    if (chainTarget === target || chainTarget === bullet.chainFrom) continue;

                    const adx = chainTarget.x - bullet.x - bullet.width;
                    const ady = chainTarget.y - bullet.y - bullet.width;
                    const ad = Math.hypot(adx, ady);

                    if (ad < nearestTargetDist && ad < chainRadius + chainTarget.radius + bullet.width) {
                        nearestTargetDist = ad;
                        nextTarget = chainTarget;
                    }
                }

                if (nextTarget && (bullet.args.chain ?? 0) > 0) {
                    const adx = nextTarget.x - bullet.x - bullet.width;
                    const ady = nextTarget.y - bullet.y - bullet.width;

                    bullet.angle = Math.atan2(ady, adx);
                    bullet.args.chain = Math.floor(bullet.args.chain - 1);
                    bullet.chainFrom = target;

                    bullet.dist = 0;

                    return;
                } else {
                    bullet.dead = true;
                }
            } else if (bullet.explos === BULLET_EXPLOS.AOE) {
                damageEnemy(target, bullet.damage);

                const blastRadius = bullet.args.aoeRadius || 150;

                for (const areaTarget of targets) {
                    if (areaTarget === target) continue;
                    const adx = areaTarget.x - bullet.x;
                    const ady = areaTarget.y - bullet.y;
                    const ad = Math.hypot(adx, ady);
                    if (ad <= blastRadius + areaTarget.radius) {
                        const falloff = Math.max(0, 1 - (ad / blastRadius));

                        const finalDamage = bullet.damage * falloff;
                        damageEnemy(areaTarget, finalDamage);
                    }
                }
            } else if (bullet.explos == BULLET_EXPLOS.PIERCE) {
                if (!bullet.transpierced.includes(target)) {
                    damageEnemy(target, bullet.damage);
                    bullet.transpierced.push(target);
                    bullet.args.pierce = Math.floor(bullet.args.pierce - 1);
                }
            } else {
                damageEnemy(target, bullet.damage);
            }
            if ((bullet.explos !== BULLET_EXPLOS.PIERCE && bullet.explos !== BULLET_EXPLOS.CHAIN) || bullet.args.pierce <= 0 || bullet.args.chain <= 0)
                bullet.dead = true;
            break;
        }
    }
}