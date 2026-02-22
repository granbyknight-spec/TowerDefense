// Projectile logic

class Projectile {
    constructor(x, y, target, damage, speed, color, splashRadius, slow, slowDuration) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = speed;
        this.color = color;
        this.splashRadius = splashRadius;
        this.slow = slow;
        this.slowDuration = slowDuration || 0;
        this.alive = true;
        this.size = 4;

        this.targetX = target.x;
        this.targetY = target.y;
    }

    update(dt, enemies, particles) {
        if (!this.alive) return;

        if (this.target && this.target.alive) {
            this.targetX = this.target.x;
            this.targetY = this.target.y;
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const move = this.speed * dt;

        if (d <= move + 5) {
            this.alive = false;

            if (this.splashRadius > 0) {
                for (const enemy of enemies) {
                    if (!enemy.alive) continue;
                    const ed = dist(this.targetX, this.targetY, enemy.x, enemy.y);
                    if (ed <= this.splashRadius) {
                        enemy.takeDamage(this.damage);
                        if (this.slow > 0) {
                            enemy.applySlow(this.slow, this.slowDuration);
                        }
                    }
                }
                GameAudio.splash();
                if (particles) {
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 / 8) * i;
                        particles.push({
                            x: this.targetX,
                            y: this.targetY,
                            vx: Math.cos(angle) * 60,
                            vy: Math.sin(angle) * 60,
                            life: 0.4,
                            maxLife: 0.4,
                            color: this.color,
                            size: 5
                        });
                    }
                }
            } else {
                if (this.target && this.target.alive) {
                    this.target.takeDamage(this.damage);
                    if (this.slow > 0) {
                        this.target.applySlow(this.slow, this.slowDuration);
                    }
                }
            }
        } else {
            this.x += (dx / d) * move;
            this.y += (dy / d) * move;
        }
    }
}
