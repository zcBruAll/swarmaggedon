import { WEAPON_ENCHANT } from './weapon.js';
import { ENEMY_TYPE } from './actors/enemy.js';

export function drawBackground(ctx, width, height, camera) {
    ctx.clearRect(0, 0, width, height);
    const gridSize = 100;

    const offsetX = (-camera?.x ?? 0) % gridSize;
    const offsetY = (-camera?.y ?? 0) % gridSize;

    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = offsetX; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }

    for (let y = offsetY; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }

    ctx.setLineDash([]);
    ctx.stroke();
}

export function drawActors(ctx, camera, actors, canvasW, canvasH) {
    for (const actor of actors) {
        switch (actor.drawType) {
            case 'player': drawPlayer(ctx, camera, actor); break;
            case 'enemy': drawEnemy(ctx, camera, actor, canvasW, canvasH); break;
            case 'bullet': drawBullet(ctx, camera, actor); break;
        }
    }
}

function drawPlayer(ctx, camera, player) {
    _drawWeaponArc(ctx, camera, player, false);

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(player.x - camera.x, player.y - camera.y,
        player.radius, player.radius, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawEnemy(ctx, camera, enemy, canvasW, canvasH) {
    if (enemy.spawnIn > 1.5) return;

    const sx = enemy.x - camera.x;
    const sy = enemy.y - camera.y;
    const alpha = Math.max(0, 1 - enemy.spawnIn / 1.25);

    const onScreen = sx > -(enemy.radius + enemy.weapon.range)
        && sx < canvasW + enemy.radius + enemy.weapon.range
        && sy > -(enemy.radius + enemy.weapon.range)
        && sy < canvasH + enemy.radius + enemy.weapon.range;

    if (onScreen) {
        _drawWeaponArc(ctx, camera, enemy, true);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.ellipse(sx, sy, enemy.radius, enemy.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Enemy HP bar
        if (enemy.hp < enemy.maxHp) {
            const barW = enemy.radius * 2.4;
            const barH = enemy.type === ENEMY_TYPE.BOSS ? 6 : 3;
            const bx = sx - barW / 2;
            const by = sy - enemy.radius - (enemy.type === ENEMY_TYPE.BOSS ? 18 : 10);
            const filled = (enemy.hp / enemy.maxHp) * barW;

            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(bx, by, barW, barH);

            ctx.fillStyle = enemy.hp / enemy.maxHp > 0.5 ? 'orange' : 'red';
            ctx.fillRect(bx, by, filled, barH);
            ctx.restore();
        }
    } else {
        _drawOffscreenIndicator(ctx, sx, sy, enemy.color, alpha, canvasW, canvasH);
    }
}

export function drawBullet(ctx, camera, bullet) {
    if (bullet.dead) return;
    ctx.fillStyle = '#007b00';
    ctx.beginPath();
    ctx.ellipse(
        bullet.x - camera.x, bullet.y - camera.y,
        bullet.width * 1.5, bullet.width,
        bullet.angle, 0, Math.PI * 2,
    );
    ctx.fill();
}

function _drawWeaponArc(ctx, camera, bearer, subtleArea = true) {
    const weapon = bearer.weapon;
    if (!weapon) return;
    if (bearer.spawnIn > 0) return;

    const sx = bearer.x - camera.x;
    const sy = bearer.y - camera.y;

    let strokeStyle = "#c9570b";
    let lineDash = [8, 8];

    const ready = weapon.cooldownTime <= 0
        || ((weapon.enchant === WEAPON_ENCHANT.CHARGE || weapon.enchant === WEAPON_ENCHANT.LASER)
            && weapon.charging);

    if (ready) { strokeStyle = '#169116'; lineDash = []; }

    ctx.save();

    // Weapon cooldown
    if (!subtleArea && (weapon.enchant !== WEAPON_ENCHANT.CHARGE || !weapon.charging)) {
        const ringR = bearer.radius + 3;
        ctx.beginPath();
        ctx.ellipse(sx, sy, ringR, ringR, 0,
            weapon.cooldownTime / weapon.cooldown * Math.PI * 2, Math.PI * 2);
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.stroke();
        ctx.closePath();
    }

    // Weapon area
    let lineWidth = 1;
    let angle = bearer.angle;
    let weaponAngle = weapon.angle ?? 0;

    if (weapon.enchant === WEAPON_ENCHANT.LASER && weapon.charging) {
        const perc = 1 - weapon.laserCdTime / weapon.laserCd;
        lineWidth = weapon.bulletWidth * perc;
        strokeStyle = `rgba(237,47,50,${perc})`;
        angle = weapon.laserAngle;
    } else if (weapon.enchant === WEAPON_ENCHANT.SUBMACHINEGUN) {
        weaponAngle = weapon.dispersion;
    }

    let weaponRange = weapon.range;
    if (weapon.enchant === WEAPON_ENCHANT.CHARGE && weapon.charging) {
        weaponRange = weapon.range * (weapon.chargeTime * weapon.rngSpeed) / 100;
    }

    const readyRatio = 1 - (Math.max(0, weapon.cooldownTime) / weapon.cooldown);

    const halfSpread = (weaponAngle / 2) * (Math.PI / 180);
    const arcRadius = bearer.radius + weaponRange;

    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.setLineDash(lineDash);
    ctx.moveTo(sx, sy);
    ctx.arc(sx, sy, arcRadius, angle - halfSpread, angle + halfSpread);
    ctx.lineTo(sx, sy);
    ctx.globalAlpha = (subtleArea ? 0.075 : 0.75) * readyRatio;
    ctx.stroke();
    ctx.globalAlpha = (subtleArea ? 0.035 : 0.25) * readyRatio;
    ctx.fillStyle = strokeStyle;
    ctx.fill();

    ctx.restore();
}

function _drawOffscreenIndicator(ctx, sx, sy, color, alpha, canvasW, canvasH) {
    const margin = 20;
    const centerX = canvasW / 2;
    const centerY = canvasH / 2;

    let ix = Math.max(margin, Math.min(canvasW - margin, sx));
    let iy = Math.max(margin, Math.min(canvasH - margin, sy));

    const dist = Math.hypot(sx - centerX, sy - centerY);
    const scale = Math.max(0.5, 1 - (dist / 2000));
    const size = 16 * scale;

    const angle = Math.atan2(sy - iy, sx - ix);

    ctx.save();
    ctx.translate(ix, iy);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size, -size * 0.7);
    ctx.lineTo(-size, size * 0.7);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.75 * alpha;
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
}