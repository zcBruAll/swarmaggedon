export function createAoeEffect(x, y, radius, color = '#e67e22', duration = 0.45) {
    return {
        isActor: true,
        team: null,
        targetable: false,
        persistent: false,
        drawType: 'aoeEffect',
        score: 0,

        x, y,
        radius,
        angle: 0,
        hp: 1,
        dead: false,

        color,
        duration,
        elapsed: 0,

        update(dt) {
            this.elapsed += dt;
            if (this.elapsed >= this.duration) this.dead = true;
        },

        takeDamage() { },
        onDeath() { },
        draw() { },
    };
}