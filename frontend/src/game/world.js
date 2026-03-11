export const TEAM = {
    PLAYER: 'player',
    ENEMY: 'enemy',
}

export function createWorld() {
    const actors = [];
    const toSpawn = [];

    let score = 0;
    let kills = 0;
    let wave = 0;
    let elapsed = 0;

    const events = [];

    function actorsOnTeam(team) {
        return actors.filter(a => a.team === team && a.hp > 0 && !a.dead);
    }

    function nearestActor(x, y, team, exclude = null) {
        let best = null;
        let bestDist = Infinity;
        for (const a of actors) {
            if (a.team !== team) continue;
            if (a === exclude) continue;
            if (a.hp <= 0 || a.dead) continue;
            if (a.isActor && a.targetable === false) continue;
            const d = Math.hypot(a.x - x, a.y - y);
            if (d < bestDist) {
                bestDist = d;
                best = a;
            }
        }
        return best;
    }

    function actorsinRadius(x, y, radius, team = null, exclude = null) {
        return actors.filter(a => {
            if (a === exclude) return false;
            if (a.hp <= 0 || a.dead) return false;
            if (team && a.team !== team) return false;
            return Math.hypot(a.x - x, a.y - y) <= radius + (a.radius ?? 0);
        });
    }

    function spawnActor(actor) {
        toSpawn.push(actor);
    }

    function flushSpawns() {
        for (const a of toSpawn) actors.push(a);
        toSpawn.length = 0;
    }

    function aoeBlast(x, y, radius, damage, targetTeam, exclude = null) {
        for (const a of actors) {
            if (a.team !== targetTeam) continue;
            if (a === exclude) continue;
            if (a.hp <= 0 || a.dead) continue;
            const d = Math.hypot(a.x - x, a.y - y);
            if (d <= radius + (a.radius ?? 0)) {
                const falloff = Math.max(0, 1 - d / radius);
                a.takeDamage(damage * falloff, null, world);
            }
        }
    }

    function cleanupDead() {
        let w = 0;
        for (let r = 0; r < actors.length; r++) {
            const a = actors[r];
            const isDead = a.hp <= 0 || a.dead;

            if (isDead && a.onDeath) {
                a.onDeath(world);
            }

            if (isDead && a.score) {
                score += a.score;
                kills += 1;
                emit({ type: 'kill', actor: a });
            }

            if (isDead && a.persistent) {
                a.hp = 0;
                actors[w++] = a;
                continue;
            }

            if (!isDead) actors[w++] = a;
        }
        actors.length = w;
    }

    function emit(event) {
        events.push(event);
    }

    function flushEvents() {
        const copy = events.slice();
        events.length = 0;
        return copy;
    }

    const world = {
        actors,

        actorsOnTeam,
        nearestActor,
        actorsinRadius,

        spawnActor,
        flushSpawns,
        aoeBlast,
        cleanupDead,

        emit,
        flushEvents,

        get score() { return score; },
        get kills() { return kills; },
        get wave() { return wave; },
        set wave(v) { wave = v; },
        get elapsed() { return elapsed; },
        addScore(n) { score += n; },
        addKill() { kills += 1; },
        addElapsed(dt) { elapsed += dt; },
    };

    return world;
}