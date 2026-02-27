export function drawBackground(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
}

export function drawPlayer(ctx, player) {
    let playerRegion = new Path2D();
    playerRegion.ellipse(player.x, player.y, player.radius, player.radius, 0, 0, 2 * Math.PI);
    playerRegion.closePath();
    ctx.fillStyle = "#000000";
    ctx.fill(playerRegion);
}

export function drawWeapon(ctx, player) {
    if (!player.weapon) return;

    // Weapon radius
    ctx.beginPath();
    const weaponRadius = player.radius + player.weapon.range;
    ctx.ellipse(player.x, player.y, weaponRadius, weaponRadius, 0, player.weapon.cooldown / player.weapon.cooldownTime * 2 * Math.PI, 2 * Math.PI);
    let strokeStyle = "#c9570b";
    if (player.weapon.cooldown <= 0) {
        strokeStyle = "#169116";
    }

    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
    ctx.closePath();

    // Weapon angle 
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);

    const halfSpread = ((player.weapon.angle ?? 0) / 2) * (Math.PI / 180);
    const startAngle = player.angle - halfSpread;
    const endAngle = player.angle + halfSpread;

    ctx.arc(player.x, player.y, weaponRadius, startAngle, endAngle);

    ctx.lineTo(player.x, player.y);

    ctx.stroke();
}

export function drawEnemies(ctx, enemies) {
    if (!enemies || enemies.length <= 0) return;
    for (const enemy of enemies) {
        drawEnemy(ctx, enemy);
    }
}

export function drawEnemy(ctx, enemy) {
    let enemyRegion = new Path2D();
    enemyRegion.ellipse(enemy.x, enemy.y, enemy.radius, enemy.radius, 0, 0, 2 * Math.PI);
    enemyRegion.closePath();
    ctx.fillStyle = "#ff0000";
    ctx.fill(enemyRegion);
}

export function drawBullets(ctx, bullets) {
    for (const bullet of bullets) {
        drawBullet(ctx, bullet);
    }
}

export function drawBullet(ctx, bullet) {
    ctx.fillStyle = "#00ff00";
    ctx.beginPath();
    ctx.ellipse(bullet.x, bullet.y, 6, 3, bullet.angle, 0, 2 * Math.PI);
    ctx.fill();
}