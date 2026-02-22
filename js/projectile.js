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

        // Chain lightning (set by Tower if chainCount > 0)
        this.chainCount = 0;
        this.chainRange = 0;
        this.chainFalloff = 0.6;
        this.chainArcs = []; // [{x1,y1,x2,y2,life,maxLife}] for rendering

        // Super tower effects (set by Tower)
        this.stunDuration = 0;
        this.freezeDuration = 0;

        // Trail history for rendering (ring buffer)
        this.trail = [];
        this._trailTimer = 0;
        this._trailIdx = 0;
    }

    update(dt, enemies, particles) {
        // Decay chain arc visuals even when dead
        if (this.chainArcs.length > 0) {
            let writeIdx = 0;
            for (let i = 0; i < this.chainArcs.length; i++) {
                this.chainArcs[i].life -= dt;
                if (this.chainArcs[i].life > 0) {
                    this.chainArcs[writeIdx++] = this.chainArcs[i];
                }
            }
            this.chainArcs.length = writeIdx;
        }
        if (!this.alive) return;

        if (this.target && this.target.alive) {
            this.targetX = this.target.x;
            this.targetY = this.target.y;
        }

        // Record trail positions (ring buffer - no filter/shift)
        this._trailTimer -= dt;
        if (this._trailTimer <= 0) {
            this._trailTimer = 0.03;
            if (this.trail.length >= 8) {
                // Reuse oldest slot
                const slot = this.trail[this._trailIdx % 8];
                slot.x = this.x; slot.y = this.y; slot.life = 0.2;
                this._trailIdx++;
            } else {
                this.trail.push({ x: this.x, y: this.y, life: 0.2 });
                this._trailIdx = this.trail.length;
            }
        }
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].life -= dt;
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
                        if (this.freezeDuration > 0) {
                            enemy.applyFreeze(this.freezeDuration);
                        }
                        if (this.stunDuration > 0) {
                            enemy.applyFreeze(this.stunDuration);
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
                    if (this.freezeDuration > 0) {
                        this.target.applyFreeze(this.freezeDuration);
                    }
                    if (this.stunDuration > 0) {
                        this.target.applyFreeze(this.stunDuration);
                    }
                }

                // Chain lightning: bounce to nearby enemies
                if (this.chainCount > 0 && this.target) {
                    this._doChainLightning(enemies, particles);
                }
            }
        } else {
            this.x += (dx / d) * move;
            this.y += (dy / d) * move;
        }
    }

    _doChainLightning(enemies, particles) {
        const hit = new Set();
        hit.add(this.target);
        let prevX = this.target.x;
        let prevY = this.target.y;
        let chainDmg = Math.floor(this.damage * this.chainFalloff);

        for (let i = 0; i < this.chainCount; i++) {
            let nearest = null;
            let nearDist = Infinity;

            for (const e of enemies) {
                if (!e.alive || e.reachedEnd || hit.has(e)) continue;
                const d = dist(prevX, prevY, e.x, e.y);
                if (d <= this.chainRange && d < nearDist) {
                    nearest = e;
                    nearDist = d;
                }
            }

            if (!nearest) break;

            // Store arc for rendering
            this.chainArcs.push({
                x1: prevX, y1: prevY,
                x2: nearest.x, y2: nearest.y,
                life: 0.3, maxLife: 0.3
            });

            nearest.takeDamage(chainDmg);
            hit.add(nearest);

            // Spark particles at chain point
            if (particles) {
                for (let j = 0; j < 3; j++) {
                    const angle = Math.random() * Math.PI * 2;
                    particles.push({
                        x: nearest.x, y: nearest.y,
                        vx: Math.cos(angle) * 40,
                        vy: Math.sin(angle) * 40,
                        life: 0.25, maxLife: 0.25,
                        color: '#FFEB3B', size: 3
                    });
                }
            }

            prevX = nearest.x;
            prevY = nearest.y;
            chainDmg = Math.floor(chainDmg * this.chainFalloff);
            if (chainDmg < 1) chainDmg = 1;
        }
    }
}
