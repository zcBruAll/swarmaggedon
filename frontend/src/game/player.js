import { createWeapon } from "./weapon.js";

export function createPlayer(canvasWidth, canvasHeight) {
    return {
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        radius: 16,
        angle: 0,
        hp: 100,
        maxHp: 100,
        speed: 200,
        weapon: undefined,
        bullets: [],
        type: 'player',
        items: [],
    };
}

export function updatePlayer(player, input, dt, enemies, canvasWidth, canvasHeight) {
    const dirY = input.keys.up ? -1 : input.keys.down ? 1 : 0;
    const dirX = input.keys.left ? -1 : input.keys.right ? 1 : 0;
    player.x += player.speed * dt * dirX;
    player.y += player.speed * dt * dirY;

    let nearestEnemy = 1e6;
    for (const enemy of enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const d = Math.hypot(dx, dy);
        if (d < nearestEnemy) {
            player.angle = Math.atan2(dy, dx);
            nearestEnemy = d;
        }
    }
}

export function damagePlayer(player, amount) {
    player.hp -= Math.min(amount, player.hp);
}

export function healPlayer(target, amount) {
    target.hp += Math.min(amount, target.maxHp - target.hp);
}

export function increaseMaxHp(player, percent) {
    const lifePercent = player.hp / player.maxHp * 100;
    player.maxHp = Math.round(player.maxHp * (1 + (percent / 100)));
    player.hp = Math.round(player.maxHp * lifePercent / 100);
}

export function equipWeapon(player, weapon) {
    player.weapon = weapon;
}