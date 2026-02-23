export function createEnemy(canvasWidth, canvasHeight) {
    return {
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        radius: 5,
        hp: 10,
        maxHp: 10,
        speed: 100,
        cooldown: 0,
        interval: 15,
        damage: 25,
    };
}

export function updateEnemies(enemies, player, dt) {
    for (const enemy of enemies) {
        updateEnemy(enemy, player, dt);
    }
}

function updateEnemy(enemy, player, dt) {
    const dirX = player.x > enemy.x ? 1 : -1;
    const dirY = player.y > enemy.y ? 1 : -1;
    enemy.x += dirX * enemy.speed * dt;
    enemy.y += dirY * enemy.speed * dt;
}

export function spawnWave(wave, canvasWidth, canvasHeight) {
    let enemies = [];
    for (let i = 0; i < wave; i++) {
        enemies.push(createEnemy(canvasWidth, canvasHeight));
    }
    return enemies;
}

export function damageEnemy(enemy, amount) {
    enemy.hp -= Math.min(amount, enemy.hp);
}