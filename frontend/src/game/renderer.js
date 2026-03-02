import { ENEMY_TYPE } from "./enemies";

export function drawBackground(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
}

export function drawPlayer(ctx, camera, player) {
    let playerRegion = new Path2D();
    playerRegion.ellipse(player.x - camera.x, player.y - camera.y, player.radius, player.radius, 0, 0, 2 * Math.PI);
    playerRegion.closePath();
    ctx.fillStyle = "#000000";
    ctx.fill(playerRegion);
}

export function drawWeapon(ctx, camera, bearer, debug = true) {
    if (!bearer.weapon) return;

    // Weapon radius
    ctx.beginPath();
    const cooldownRadius = bearer.radius + (debug ? bearer.weapon.range : 3);
    ctx.ellipse(bearer.x - camera.x, bearer.y - camera.y, cooldownRadius, cooldownRadius, 0, bearer.weapon.cooldown / bearer.weapon.cooldownTime * 2 * Math.PI, 2 * Math.PI);
    let strokeStyle = "#c9570b";
    ctx.lineWidth = 3;
    let lineDash = [8, 8];
    ctx.setLineDash([]);
    if (bearer.weapon.cooldown <= 0) {
        strokeStyle = "#169116";
        lineDash = [];
    }

    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
    ctx.closePath();

    // Weapon angle 
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.setLineDash(lineDash);
    ctx.moveTo(bearer.x - camera.x, bearer.y - camera.y);

    const halfSpread = ((bearer.weapon.angle ?? 0) / 2) * (Math.PI / 180);
    const startAngle = bearer.angle - halfSpread;
    const endAngle = bearer.angle + halfSpread;
    const weaponRadius = bearer.radius + bearer.weapon.range;

    ctx.arc(bearer.x - camera.x, bearer.y - camera.y, weaponRadius, startAngle, endAngle);

    ctx.lineTo(bearer.x - camera.x, bearer.y - camera.y);

    ctx.stroke();
    ctx.fillStyle = strokeStyle + '25';
    ctx.fill();
}

export function drawEnemies(ctx, camera, enemies) {
    if (!enemies || enemies.length <= 0) return;
    for (const enemy of enemies) {
        drawEnemy(ctx, camera, enemy);
    }
}

export function drawEnemy(ctx, camera, enemy) {
    let enemyRegion = new Path2D();
    enemyRegion.ellipse(enemy.x - camera.x, enemy.y - camera.y, enemy.radius, enemy.radius, 0, 0, 2 * Math.PI);
    enemyRegion.closePath();
    ctx.fillStyle = enemy.color;
    ctx.fill(enemyRegion);

    // Enemy HP bar
    if (enemy.hp < enemy.maxHp) {
        const barW = enemy.radius * 2.4;
        const barH = enemy.type === ENEMY_TYPE.BOSS ? 6 : 3;
        const bx = enemy.x - camera.x - barW / 2;
        const by = enemy.y - camera.y - enemy.radius - (enemy.type === ENEMY_TYPE.BOSS ? 18 : 10);
        const filled = (enemy.hp / enemy.maxHp) * barW;

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(bx, by, barW, barH);

        const percent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = percent > 0.5
            ? 'orange'
            : 'red';
        ctx.fillRect(bx, by, filled, barH);
    }
}

export function drawBullets(ctx, camera, bullets) {
    for (const bullet of bullets) {
        drawBullet(ctx, camera, bullet);
    }
}

export function drawBullet(ctx, camera, bullet) {
    ctx.fillStyle = "#00ff00";
    ctx.beginPath();
    ctx.ellipse(bullet.x - camera.x, bullet.y - camera.y, 6, 3, bullet.angle, 0, 2 * Math.PI);
    ctx.fill();
}