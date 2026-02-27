import { damageEnemy } from "./enemies";

export const BULLET_EXPLOS = {
    HIT: 'hit',
    AOE: 'aoe',
    TRANSFER: 'transfer',
}

export function createBullet(x, y, angle) {
    return {
        x: x,
        y: y,
        angle: angle,
        speed: 500,
        damage: 15,
        explos: BULLET_EXPLOS.HIT,
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
    if (bullet.dist > MAX_BULLET_DIST) {
        bullet.dead = true;
        return;
    }

    for (const target of targets) {
        const dx = target.x - bullet.x;
        const dy = target.y - bullet.y;
        const d = Math.hypot(dx, dy);
        if (d <= target.radius) {
            damageEnemy(target, bullet.damage);
            if (bullet.explos == BULLET_EXPLOS.HIT)
                bullet.dead = true;
            break;
        }
    }
}