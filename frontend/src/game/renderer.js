export function drawBackground(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    //ctx.fillRect(0, 0, width, height);
}

export function drawPlayer(ctx, player) {
    // TODO: Draw player
    ctx.beginPath();
    ctx.ellipse(player.x, player.y, 15, 30, 0, 0, 2 * Math.PI);
    ctx.stroke();
}

export function drawEnemies(ctx, enemies) {
    if (!enemies || enemies.length <= 0) return;
    for (const enemy of enemies) {
        drawEnemy(enemy);
    }
}

export function drawEnemy(ctx, enemy) {
    // TODO: Draw enemy
}

export function drawGameOver(ctx, width, height, score, elapsed) {
    // TODO: Game over text
}

export function drawPause(ctx, width, height) {
    // TODO: Draw pause menu
}