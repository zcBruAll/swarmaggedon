import { damageEnemy } from "./enemies";

export const BULLET_EXPLOS = {
    HIT: 'hit',
    AOE: 'aoe',
    PIERCE: 'pierce',
    TRANSFER: 'transfer',
}

export function createBullet(x, y, angle, damage, range, type = BULLET_EXPLOS.HIT, args = null) {
    return {
        x,
        y,
        angle,
        speed: 500,
        damage,
        range,
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
        const dx = target.x - bullet.x;
        const dy = target.y - bullet.y;
        const d = Math.hypot(dx, dy);

        if (d <= target.radius) {
            if (bullet.explos == BULLET_EXPLOS.AOE) {
                const blastRadius = bullet.args.aoeRadius || 150;

                for (const areaTarget of targets) {
                    const adx = areaTarget.x - bullet.x;
                    const ady = areaTarget.y - bullet.y;
                    const ad = Math.hypot(adx, ady);
                    if (ad <= blastRadius + areaTarget.radius) {
                        const falloff = Math.max(0, 1 - (ad / blastRadius));

                        const finalDamage = bullet.damage * falloff;
                        damageEnemy(areaTarget, finalDamage);
                    }
                }
            } else {
                damageEnemy(target, bullet.damage);
            }
            bullet.dead = true;
            break;
        }
    }
}