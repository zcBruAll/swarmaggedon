export function createEnemy(player, canvasWidth, canvasHeight) {
    const randAngle = Math.random() * Math.PI * 2;
    const randDist = Math.random() * 500;
    const safeRadius = 150;
    const spawnRadius = safeRadius + randDist;
    return {
        x: player.x + Math.cos(randAngle) * spawnRadius,
        y: player.y + Math.sin(randAngle) * spawnRadius,
        radius: 5,
        hp: 10,
        maxHp: 10,
        speed: 100,
        cooldown: 0,
        interval: 15,
        damage: 25,
        score: 10,
    };
}

export function updateEnemies(enemies, player, dt) {
    for (const enemy of enemies) {
        updateEnemy(enemy, player, dt);
    }
}

function updateEnemy(enemy, player, dt) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;

    const distance = Math.hypot(dx, dy);

    if (distance > 0) {
        enemy.x += (dx / distance) * enemy.speed * dt;
        enemy.y += (dy / distance) * enemy.speed * dt;
    }
}

export function spawnWave(wave, player, canvasWidth, canvasHeight) {
    let enemies = [];
    for (let i = 0; i < wave; i++) {
        enemies.push(createEnemy(player, canvasWidth, canvasHeight));
    }
    return enemies;
}

export function damageEnemy(enemy, amount) {
    enemy.hp -= Math.min(amount, enemy.hp);
}