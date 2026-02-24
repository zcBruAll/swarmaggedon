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
    ctx.beginPath();
    const weaponRadius = player.radius + player.weapon.radius;
    ctx.ellipse(player.x, player.y, weaponRadius, weaponRadius, 0, 0, 2 * Math.PI);
    let scrollStyle = "#00000000";
    if (player.weapon.cooldown <= 0) {
        scrollStyle = "#169116";
    } else if (player.weapon.cooldown < 5) {
        scrollStyle = '#918316'
    }

    ctx.strokeStyle = scrollStyle;
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