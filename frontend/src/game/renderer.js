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