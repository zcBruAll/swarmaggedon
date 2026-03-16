import { WEAPON_ENCHANT } from './weapon.js';
import { ENEMY_TYPE } from './actors/enemy.js';
import { TEAM } from './world.js';

export function drawBackground(ctx, width, height, camera) {
    ctx.clearRect(0, 0, width, height);

    const scale = camera.scale ?? 1;
    const gridSize = 100;

    const offsetX = ((-camera.x) % gridSize) * scale;
    const offsetY = ((-camera.y) % gridSize) * scale;
    const step = gridSize * scale;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = offsetX; x <= width; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    for (let y = offsetY; y <= height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }

    ctx.setLineDash([]);
    ctx.stroke();
}

export function drawActors(ctx, camera, actors, canvasW, canvasH) {
    const scale = camera.scale ?? 1;

    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-camera.x, -camera.y);

    for (const actor of actors) {
        switch (actor.drawType) {
            case 'player': drawPlayer(ctx, actor); break;
            case 'enemy': drawEnemy(ctx, actor, canvasW, canvasH, camera); break;
            case 'bullet': drawBullet(ctx, actor); break;
        }
    }

    ctx.restore();
}

function drawPlayer(ctx, player) {
    _drawWeaponArc(ctx, player, false);

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y, player.radius, player.radius, 0, 0, Math.PI * 2);
    ctx.fill();

    if (player.weapon?.enchant === WEAPON_ENCHANT.MOMENTUM && player.weapon.stacks > 0) {
        const stacks = player.weapon.stacks;
        const max = player.weapon.maxStacks;
        const ratio = stacks / max;
        const color = ratio >= 1 ? '#e74c3c' : ratio > 0.5 ? '#e67e22' : '#ffffff';

        ctx.save();
        ctx.font = `bold ${10 + stacks}px sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.fillText(`${stacks}`, player.x, player.y - player.radius - 8);
        ctx.restore();
    }
}

function drawEnemy(ctx, enemy, canvasW, canvasH, camera) {
    if (enemy.spawnIn > 1.5) return;

    const scale = camera.scale ?? 1;
    const alpha = Math.max(0, 1 - enemy.spawnIn / 1.25);

    // On-screen check is still in screen space — convert enemy world pos to screen pos
    const sx = (enemy.x - camera.x) * scale;
    const sy = (enemy.y - camera.y) * scale;
    const screenR = (enemy.radius + enemy.weapon.range) * scale;

    const onScreen = sx > -screenR && sx < canvasW + screenR
        && sy > -screenR && sy < canvasH + screenR;

    if (onScreen) {
        _drawWeaponArc(ctx, enemy, true);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.ellipse(enemy.x, enemy.y, enemy.radius, enemy.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // HP bar (in world space — scales with zoom automatically)
        if (enemy.hp < enemy.maxHp) {
            const barW = enemy.radius * 2.4;
            const barH = enemy.type === ENEMY_TYPE.BOSS ? 6 : 3;
            const bx = enemy.x - barW / 2;
            const by = enemy.y - enemy.radius - (enemy.type === ENEMY_TYPE.BOSS ? 18 : 10);
            const filled = (enemy.hp / enemy.maxHp) * barW;

            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(bx, by, barW, barH);
            ctx.fillStyle = enemy.hp / enemy.maxHp > 0.5 ? 'orange' : 'red';
            ctx.fillRect(bx, by, filled, barH);
            ctx.restore();
        }
    } else {
        ctx.save();
        ctx.resetTransform();
        _drawOffscreenIndicator(ctx, sx, sy, enemy.color, alpha, canvasW, canvasH);
        ctx.restore();
    }
}

export function drawBullet(ctx, bullet) {
    if (bullet.dead) return;
    ctx.fillStyle = '#007b00';
    ctx.beginPath();
    ctx.ellipse(
        bullet.x, bullet.y,
        bullet.width * 1.5, bullet.width,
        bullet.angle, 0, Math.PI * 2,
    );
    ctx.fill();
}

function _drawWeaponArc(ctx, bearer, subtleArea = true) {
    const weapon = bearer.weapon;
    if (!weapon) return;
    if (bearer.spawnIn > 0) return;

    const sx = bearer.x;
    const sy = bearer.y;

    let strokeStyle = '#c9570b';
    let lineDash = [8, 8];

    const laserCharging = weapon.enchant === WEAPON_ENCHANT.LASER && weapon.charging;

    const ready = weapon.cooldownTime <= 0
        || ((weapon.enchant === WEAPON_ENCHANT.CHARGE || laserCharging) && weapon.charging);

    if (ready) { strokeStyle = '#169116'; lineDash = []; }

    ctx.save();

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

    const readyRatio = laserCharging ? 1 : 1 - (Math.max(0, weapon.cooldownTime) / weapon.cooldown);
    const halfSpread = (weaponAngle / 2) * (Math.PI / 180);
    const arcRadius = bearer.radius + weaponRange;

    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.setLineDash(lineDash);
    ctx.moveTo(sx, sy);
    ctx.arc(sx, sy, arcRadius, angle - halfSpread, angle + halfSpread);
    ctx.lineTo(sx, sy);
    ctx.globalAlpha = (subtleArea && !laserCharging ? 0.075 : 0.75) * readyRatio;
    ctx.stroke();
    ctx.globalAlpha = (subtleArea && !laserCharging ? 0.035 : 0.25) * readyRatio;
    ctx.fillStyle = strokeStyle;
    ctx.fill();

    if (bearer.team === TEAM.PLAYER && weapon.enchant === WEAPON_ENCHANT.SWEETSPOT) {
        const sweetspotThreshold = weapon.range * ((weapon.sweetspot ?? 15) / 100);
        const innerR = bearer.radius + weapon.range - sweetspotThreshold;
        const outerR = bearer.radius + weapon.range;

        ctx.beginPath();
        ctx.arc(sx, sy, outerR, angle - halfSpread, angle + halfSpread);
        ctx.arc(sx, sy, innerR, angle + halfSpread, angle - halfSpread, true);
        ctx.closePath();

        ctx.globalAlpha = ready ? 0.35 : 0.15;
        ctx.fill();
    }

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