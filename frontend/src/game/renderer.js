import { ENEMY_TYPE } from "./enemies";
import { WEAPON_ENCHANT } from "./weapon";

export function drawBackground(ctx, width, height, camera) {
    ctx.clearRect(0, 0, width, height);
    const gridSize = 100;
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;

    const offsetX = -camera?.x % gridSize;
    const offsetY = -camera?.y % gridSize;

    ctx.beginPath();

    for (let x = offsetX; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }

    for (let y = offsetY; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }

    ctx.setLineDash([]);
    ctx.stroke();
}

export function drawPlayer(ctx, camera, player) {
    drawWeapon(ctx, camera, player, false);
    drawBullets(ctx, camera, player.bullets);

    let playerRegion = new Path2D();
    playerRegion.ellipse(player.x - camera.x, player.y - camera.y, player.radius, player.radius, 0, 0, 2 * Math.PI);
    playerRegion.closePath();
    ctx.fillStyle = "#000000";
    ctx.fill(playerRegion);
}

export function drawWeapon(ctx, camera, bearer, debug = true) {
    if (!bearer.weapon) return;

    let strokeStyle = "#c9570b";
    let lineDash = [8, 8];
    if (bearer.weapon.cooldownTime <= 0 || ((bearer.weapon.enchant === WEAPON_ENCHANT.CHARGE || bearer.weapon.enchant === WEAPON_ENCHANT.LASER) && bearer.weapon.charging)) {
        strokeStyle = "#169116";
        lineDash = [];
    }

    ctx.save();

    // Weapon cooldown
    if (bearer.weapon.enchant !== WEAPON_ENCHANT.CHARGE || !bearer.weapon.charging) {
        const cooldownRadius = bearer.radius + (debug ? bearer.weapon.range : 3);
        ctx.beginPath();
        ctx.ellipse(bearer.x - camera.x, bearer.y - camera.y, cooldownRadius, cooldownRadius, 0, bearer.weapon.cooldownTime / bearer.weapon.cooldown * 2 * Math.PI, 2 * Math.PI);
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.stroke();
        ctx.closePath();
    }

    // Weapon angle 
    let width = 1;
    let angle = bearer.angle;
    let weaponAngle = (bearer.weapon.angle ?? 0);
    if (bearer.weapon.enchant === WEAPON_ENCHANT.LASER && bearer.weapon.charging) {
        const perc = (1 - (bearer.weapon.laserCdTime / bearer.weapon.laserCd))
        width = bearer.weapon.bulletWidth * perc;
        strokeStyle = `rgba(237, 47, 50, ${perc})`;
        angle = bearer.weapon.laserAngle;
    } else if (bearer.weapon.enchant === WEAPON_ENCHANT.SUBMACHINEGUN) {
        weaponAngle = bearer.weapon.dispersion;
    }

    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.strokeStyle = strokeStyle;
    ctx.setLineDash(lineDash);
    ctx.moveTo(bearer.x - camera.x, bearer.y - camera.y);

    const halfSpread = (weaponAngle / 2) * (Math.PI / 180);
    const startAngle = angle - halfSpread;
    const endAngle = angle + halfSpread;
    let weaponRange = bearer.weapon.range;
    if (bearer.weapon.enchant === WEAPON_ENCHANT.CHARGE && bearer.weapon.charging) {
        weaponRange = bearer.weapon.range * (bearer.weapon.chargeTime * bearer.weapon.rngSpeed) / 100
    }
    const weaponRadius = bearer.radius + weaponRange;

    ctx.arc(bearer.x - camera.x, bearer.y - camera.y, weaponRadius, startAngle, endAngle);

    ctx.lineTo(bearer.x - camera.x, bearer.y - camera.y);

    ctx.stroke();
    ctx.fillStyle = strokeStyle + '25';
    ctx.fill();
    ctx.restore();
}

export function drawEnemies(ctx, camera, enemies, width, height) {
    if (!enemies || enemies.length <= 0) return;
    for (const enemy of enemies) {
        if (enemy.spawnIn > 1.5) continue;
        drawEnemy(ctx, camera, enemy, width, height);
    }
}

export function drawEnemy(ctx, camera, enemy, width, height) {
    if (enemy.type === ENEMY_TYPE.SHOOTER) {
        drawBullets(ctx, camera, enemy.bullets);
    }
    const dx = enemy.x - camera.x;
    const dy = enemy.y - camera.y;

    const enemyAlpha = Math.max(0, 1 - enemy.spawnIn / 1.25);

    if (dx > - (enemy.radius + enemy.weapon.range) && dx < width + enemy.radius + enemy.weapon.range && dy > - (enemy.radius + enemy.weapon.range) && dy < height + enemy.radius + enemy.weapon.range) {
        drawWeapon(ctx, camera, enemy, true);

        let enemyRegion = new Path2D();
        enemyRegion.ellipse(dx, dy, enemy.radius, enemy.radius, 0, 0, 2 * Math.PI);
        enemyRegion.closePath();

        ctx.save();
        ctx.fillStyle = enemy.color;
        ctx.globalAlpha = enemyAlpha;
        ctx.fill(enemyRegion);
        ctx.restore();

        // Enemy HP bar
        if (enemy.hp < enemy.maxHp) {
            const barW = enemy.radius * 2.4;
            const barH = enemy.type === ENEMY_TYPE.BOSS ? 6 : 3;
            const bx = dx - barW / 2;
            const by = dy - enemy.radius - (enemy.type === ENEMY_TYPE.BOSS ? 18 : 10);
            const filled = (enemy.hp / enemy.maxHp) * barW;

            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(bx, by, barW, barH);

            const percent = enemy.hp / enemy.maxHp;
            ctx.fillStyle = percent > 0.5
                ? 'orange'
                : 'red';
            ctx.fillRect(bx, by, filled, barH);
            ctx.restore();
        }
    } else {
        const margin = 20;
        const centerX = width / 2;
        const centerY = height / 2;

        let ix = Math.max(margin, Math.min(width - margin, dx));
        let iy = Math.max(margin, Math.min(height - margin, dy));

        const dist = Math.hypot(dx - centerX, dy - centerY);
        const scale = Math.max(0.5, 1 - (dist / 2000));
        const size = 16 * scale;

        const angle = Math.atan2(dy - iy, dx - ix);

        ctx.save();
        ctx.translate(ix, iy);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(-size, -size * 0.7);
        ctx.lineTo(-size, size * 0.7);
        ctx.closePath();

        ctx.fillStyle = enemy.color;
        ctx.globalAlpha = 0.75 * enemyAlpha;
        ctx.fill();

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }
}

export function drawBullets(ctx, camera, bullets) {
    for (const bullet of bullets) {
        drawBullet(ctx, camera, bullet);
    }
}

export function drawBullet(ctx, camera, bullet) {
    ctx.fillStyle = "#007b00";
    ctx.beginPath();
    ctx.ellipse(bullet.x - camera.x, bullet.y - camera.y, bullet.width * 1.5, bullet.width, bullet.angle, 0, 2 * Math.PI);
    ctx.fill();
}