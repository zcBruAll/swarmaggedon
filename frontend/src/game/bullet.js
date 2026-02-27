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

export function updateBullets(bullets, targets, dt) {
    for (const bullet of bullets) {
        updateBullet(bullet, targets, dt);
    }
}

export function updateBullet(bullet, targets, dt) {
    bullet.x = bullet.x + Math.cos(bullet.angle) * bullet.speed * dt;
    bullet.y = bullet.y + Math.sin(bullet.angle) * bullet.speed * dt;

    for (const target of targets) {
        const dx = target.x - bullet.x;
        const dy = target.y - bullet.y;
        const d = Math.hypot(dx, dy);
        if (d <= target.radius) {
            damageEnemy(target, bullet.damage);
            if (bullet.explos == BULLET_EXPLOS.HIT)
                bullet = undefined;
            break;
        }
    }
}