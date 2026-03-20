import { WEAPON_ENCHANT } from './weapon.js';
import { ENEMY_TYPE } from './actors/enemy.js';
import { DRONE_STATE, DRONE_ORBIT_RADIUS, DRONE_REPAIR_RADIUS } from './actors/drone.js';
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
    for (let x = offsetX; x <= width; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
    for (let y = offsetY; y <= height; y += step) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
    ctx.setLineDash([]);
    ctx.stroke();
}

export function drawActors(ctx, camera, actors, canvasW, canvasH) {
    const scale = camera.scale ?? 1;

    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-camera.x, -camera.y);

    const engineer = actors.find(a => a.drawType === 'engineer');

    for (const actor of actors) {
        switch (actor.drawType) {
            case 'player': drawPlayer(ctx, actor); break;
            case 'engineer': drawEngineer(ctx, actor); break;
            case 'drone': drawDrone(ctx, actor, engineer); break;
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

function drawEngineer(ctx, eng) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(eng.x, eng.y, DRONE_ORBIT_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(36,113,163,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.save();
    ctx.translate(eng.x, eng.y);
    ctx.rotate(eng.angle + Math.PI / 2);

    ctx.beginPath();
    _hexPath(ctx, 0, 0, eng.radius);
    ctx.fillStyle = '#2a2318';
    ctx.fill();

    ctx.fillStyle = '#f4f0e8';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.rotate(-(eng.angle + Math.PI / 2));
    ctx.fillText('E', 0, 0);

    ctx.restore();

    const nearRepairable = eng.drones?.some(d => {
        if (d.state === DRONE_STATE.WRECKED)
            return Math.hypot(d.x - eng.x, d.y - eng.y) <= DRONE_REPAIR_RADIUS * 2.5;
        if (d.state === DRONE_STATE.DEPLOYED && d.hp < d.maxHp)
            return Math.hypot(d.x - eng.x, d.y - eng.y) <= DRONE_REPAIR_RADIUS;
        return false;
    });
    if (nearRepairable) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(eng.x, eng.y, DRONE_REPAIR_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(39,174,96,0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }
}

const DRONE_COLOR_RANGE = '#2471a3';
const DRONE_COLOR_MELEE = '#8e44ad';
const DRONE_COLOR_WRECK = '#c0392b';

function drawDrone(ctx, drone, engineer) {
    if (drone.state === DRONE_STATE.STASH) return;

    const color = drone.weaponType === 'melee' ? DRONE_COLOR_MELEE : DRONE_COLOR_RANGE;

    if (engineer &&
        (drone.state === DRONE_STATE.DEPLOYED ||
            drone.state === DRONE_STATE.RECALLING)) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(engineer.x, engineer.y);
        ctx.lineTo(drone.x, drone.y);
        ctx.strokeStyle = 'rgba(36,113,163,0.13)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    ctx.save();
    ctx.translate(drone.x, drone.y);
    ctx.rotate(drone.angle);

    switch (drone.state) {
        case DRONE_STATE.ORBITING: _drawDroneOrbiting(ctx, drone, color); break;
        case DRONE_STATE.DEPLOYED: _drawDroneActive(ctx, drone, color); break;
        case DRONE_STATE.RECALLING: _drawDroneActive(ctx, drone, color); break;
        case DRONE_STATE.WRECKED: _drawDroneWrecked(ctx, drone); break;
    }

    ctx.restore();

    if (drone.state === DRONE_STATE.WRECKED && drone.repairProgress > 0) {
        _drawRepairBar(ctx, drone);
    }
    if ((drone.state === DRONE_STATE.DEPLOYED ||
        drone.state === DRONE_STATE.ORBITING) && drone.hp < drone.maxHp) {
        _drawDroneHpBar(ctx, drone, color);
    }
    
    if ((drone.state === DRONE_STATE.DEPLOYED && drone._deployTimer <= 0) ||
        drone.state === DRONE_STATE.ORBITING) {
        _drawWeaponArc(ctx, drone, true);
    }
}

function _drawDroneActive(ctx, drone, color) {
    // Soft glow
    ctx.beginPath();
    ctx.arc(0, 0, drone.radius + 5, 0, Math.PI * 2);
    ctx.fillStyle = color + '22';
    ctx.fill();

    // Diamond body
    ctx.beginPath();
    _diamondPath(ctx, 0, 0, drone.radius);
    ctx.fillStyle = color;
    ctx.fill();

    // Forward nub
    ctx.beginPath();
    ctx.arc(drone.radius * 0.55, 0, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f4f0e8';
    ctx.fill();
}

function _drawDroneOrbiting(ctx, drone, color) {
    _drawDroneActive(ctx, drone, color);

    const cdRatio = drone.weapon
        ? Math.max(0, 1 - drone.weapon.cooldownTime / drone.weapon.cooldown)
        : 1;
    const pulse = (0.15 + 0.15 * Math.sin(Date.now() / 280)) * cdRatio;
    ctx.beginPath();
    ctx.arc(0, 0, drone.radius + 7, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = pulse;
    ctx.stroke();
    ctx.globalAlpha = 1;
}

function _drawDroneWrecked(ctx, drone) {
    // Broken X
    const s = drone.radius * 0.7;
    ctx.strokeStyle = DRONE_COLOR_WRECK;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s, -s); ctx.lineTo(s, s);
    ctx.moveTo(s, -s); ctx.lineTo(-s, s);
    ctx.stroke();

    // Dashed circle
    ctx.beginPath();
    ctx.arc(0, 0, drone.radius, 0.3, Math.PI * 2 - 0.3);
    ctx.strokeStyle = 'rgba(192,57,43,0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
}

function _drawRepairBar(ctx, drone) {
    const bw = 34, bh = 4;
    const bx = drone.x - bw / 2;
    const by = drone.y - drone.radius - 16;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(bx, by, bw * drone.repairProgress, bh);
}

function _drawDroneHpBar(ctx, drone, color) {
    const bw = drone.radius * 2.4, bh = 3;
    const bx = drone.x - bw / 2;
    const by = drone.y - drone.radius - 9;
    const filled = (drone.hp / drone.maxHp) * bw;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = drone.hp / drone.maxHp > 0.5 ? color : '#e67e22';
    ctx.fillRect(bx, by, filled, bh);
}

function drawEnemy(ctx, enemy, canvasW, canvasH, camera) {
    if (enemy.spawnIn > 1.5) return;

    const scale = camera.scale ?? 1;
    const alpha = Math.max(0, 1 - enemy.spawnIn / 1.25);
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

    const ix = Math.max(margin, Math.min(canvasW - margin, sx));
    const iy = Math.max(margin, Math.min(canvasH - margin, sy));
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

function _hexPath(ctx, cx, cy, r) {
    for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + r * Math.cos(a);
        const py = cy + r * Math.sin(a);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
}

function _diamondPath(ctx, cx, cy, r) {
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r * 0.75, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r * 0.75, cy);
    ctx.closePath();
}