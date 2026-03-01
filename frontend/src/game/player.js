import { createWeapon } from "./weapon.js";

export let playerSpeed = 200;
export let playerMaxHp = 100;
export let playerRadius = 16;
export let playerInvicibilityDuration = 0.6;

export function createPlayer(canvasWidth, canvasHeight) {
    return {
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        radius: playerRadius,
        angle: 0,
        hp: playerMaxHp,
        maxHp: playerMaxHp,
        speed: playerSpeed,
        invicibleTimer: 0,
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        weapon: createWeapon(),
        bullets: [],
        type: 'player',
    };
}

export function updatePlayer(player, input, dt, enemies, canvasWidth, canvasHeight) {
    const dirY = input.keys.up ? -1 : input.keys.down ? 1 : 0;
    const dirX = input.keys.left ? -1 : input.keys.right ? 1 : 0;
    player.x += playerSpeed * dt * dirX;
    player.y += playerSpeed * dt * dirY;
    player.invicibleTimer -= Math.min(dt, player.invicibleTimer);

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
    if (player.invicibleTimer > 0) return;
    player.invicibleTimer = playerInvicibilityDuration;
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