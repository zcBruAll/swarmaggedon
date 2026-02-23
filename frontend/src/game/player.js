export let playerSpeed = 200;
export let playerMaxHp = 100;
export let playerRadius = 16;
export let playerCooldown = 0.3;
export let playerInvicibilityDuration = 0.6;

export function createPlayer(canvasWidth, canvasHeight) {
    return {
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        radius: playerRadius,
        hp: playerMaxHp,
        maxHp: playerMaxHp,
        speed: playerSpeed,
        cooldown: 0,
        interval: playerCooldown,
        invicibleTimer: 0,
        isAlive: true,
        totalDamageDealt: 0,
        totalDamageTaken: 0,
    };
}

export function updatePlayer(player, input, dt, canvasWidth, canvasHeight) {
    const dirY = input.keys.up ? -1 : input.keys.down ? 1 : 0;
    const dirX = input.keys.left ? -1 : input.keys.right ? 1 : 0;
    player.x += playerSpeed * dt * dirX;
    player.y += playerSpeed * dt * dirY;
}

export function damagePlayer(player, amount) {
    // TODO: Reduce hp, check for alive, increase totalDamageTaken
}

export function healPlayer(player, amount) {
    // TODO: Increase hp up to max hp
}