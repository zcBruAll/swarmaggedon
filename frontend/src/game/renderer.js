import { ENEMY_TYPE } from "./enemies";

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

export function drawWeapon(ctx, bearer) {
    if (!bearer.weapon) return;

    // Weapon radius
    ctx.beginPath();
    const weaponRadius = bearer.radius + bearer.weapon.range;
    ctx.ellipse(bearer.x, bearer.y, weaponRadius, weaponRadius, 0, bearer.weapon.cooldown / bearer.weapon.cooldownTime * 2 * Math.PI, 2 * Math.PI);
    let strokeStyle = "#c9570b";
    if (bearer.weapon.cooldown <= 0) {
        strokeStyle = "#169116";
    }

    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
    ctx.closePath();

    // Weapon angle 
    ctx.beginPath();
    ctx.moveTo(bearer.x, bearer.y);

    const halfSpread = ((bearer.weapon.angle ?? 0) / 2) * (Math.PI / 180);
    const startAngle = bearer.angle - halfSpread;
    const endAngle = bearer.angle + halfSpread;

    ctx.arc(bearer.x, bearer.y, weaponRadius, startAngle, endAngle);

    ctx.lineTo(bearer.x, bearer.y);

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
    ctx.fillStyle = enemy.color;
    ctx.fill(enemyRegion);

    // Enemy HP bar
    if (enemy.hp < enemy.maxHp) {
        const barW = enemy.radius * 2.4;
        const barH = enemy.type === ENEMY_TYPE.BOSS ? 6 : 3;
        const bx = enemy.x - barW / 2;
        const by = enemy.y - enemy.radius - (enemy.type === ENEMY_TYPE.BOSS ? 18 : 10);
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