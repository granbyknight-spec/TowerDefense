// Enemy (Cat) entities

class Enemy {
    constructor(type, path, tileSize) {
        const def = CONFIG.ENEMIES[type];
        this.type = type;
        this.name = def.name;
        this.maxHp = def.hp;
        this.hp = def.hp;
        this.baseSpeed = def.speed;
        this.speed = def.speed;
        this.gold = def.gold;
        this.color = def.color;
        this.armor = def.armor;
        this.size = def.size;
        this.tileSize = tileSize;
        this.alive = true;
        this.reachedEnd = false;

        // Special traits
        this.dodgeFirst = def.dodgeFirst || false;
        this.dodgeUsed = false;
        this.slowImmune = def.slowImmune || false;
        this.isBoss = def.isBoss || false;

        // Boss ability timers
        if (this.isBoss) {
            this.speedBurstTimer = 5;
            this.speedBurstActive = false;
            this.speedBurstDuration = 0;
            this.regenRate = 0.005; // 0.5% max HP per second
            this.minionTimer = 8;
        }

        // Path following
        this.path = path.slice();
        this.pathIndex = 0;

        // Position in pixels (start at first path node)
        const start = gridToPixel(path[0].col, path[0].row, tileSize);
        this.x = start.x;
        this.y = start.y;

        // Slow effect
        this.slowTimer = 0;
        this.slowFactor = 1;

        // Frozen state (from Blizzard ability)
        this.frozen = false;
        this.frozenTimer = 0;

        // Animation
        this.wobble = 0;
        this.wobbleSpeed = 3 + Math.random() * 2;
        this.dodgeFlash = 0;
    }

    updatePath(newPath) {
        if (!newPath || newPath.length === 0) return;

        let bestIdx = 0;
        let bestDist = Infinity;
        for (let i = 0; i < newPath.length; i++) {
            const p = gridToPixel(newPath[i].col, newPath[i].row, this.tileSize);
            const d = dist(this.x, this.y, p.x, p.y);
            if (d < bestDist) {
                bestDist = d;
                bestIdx = i;
            }
        }

        this.path = newPath.slice();
        this.pathIndex = bestIdx;
    }

    update(dt) {
        if (!this.alive || this.reachedEnd) return;

        // Update frozen
        if (this.frozenTimer > 0) {
            this.frozenTimer -= dt;
            this.frozen = true;
            if (this.frozenTimer <= 0) this.frozen = false;
        }

        // Update slow
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            this.speed = this.slowImmune ? this.baseSpeed : this.baseSpeed * this.slowFactor;
        } else {
            this.speed = this.baseSpeed;
        }

        // Frozen overrides speed
        if (this.frozen && !this.slowImmune) this.speed = 0;

        // Boss abilities
        if (this.isBoss) {
            this.speedBurstTimer -= dt;
            if (this.speedBurstTimer <= 0 && !this.speedBurstActive) {
                this.speedBurstActive = true;
                this.speedBurstDuration = 2;
                this.speedBurstTimer = 5;
            }
            if (this.speedBurstActive) {
                this.speedBurstDuration -= dt;
                this.speed *= 2;
                if (this.speedBurstDuration <= 0) this.speedBurstActive = false;
            }
            // HP regen
            this.hp = Math.min(this.maxHp, this.hp + this.maxHp * this.regenRate * dt);
            // Minion timer (game.js handles actual spawning)
            this.minionTimer -= dt;
        }

        // Dodge flash
        if (this.dodgeFlash > 0) this.dodgeFlash -= dt * 3;

        // Move toward next path node
        if (this.pathIndex >= this.path.length) {
            this.reachedEnd = true;
            return;
        }

        const target = gridToPixel(
            this.path[this.pathIndex].col,
            this.path[this.pathIndex].row,
            this.tileSize
        );

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const moveSpeed = this.speed * this.tileSize * dt;

        if (d <= moveSpeed) {
            this.x = target.x;
            this.y = target.y;
            this.pathIndex++;
            if (this.pathIndex >= this.path.length) this.reachedEnd = true;
        } else if (moveSpeed > 0) {
            this.x += (dx / d) * moveSpeed;
            this.y += (dy / d) * moveSpeed;
        }

        this.wobble += this.wobbleSpeed * dt;
    }

    takeDamage(amount) {
        // Ninja dodge: first hit misses
        if (this.dodgeFirst && !this.dodgeUsed) {
            this.dodgeUsed = true;
            this.dodgeFlash = 1;
            return;
        }
        const dmg = Math.max(1, amount - this.armor);
        this.hp -= dmg;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
    }

    applySlow(factor, duration) {
        if (this.slowImmune) return;
        this.slowFactor = factor;
        this.slowTimer = duration;
    }

    applyFreeze(duration) {
        if (this.slowImmune) return;
        this.frozen = true;
        this.frozenTimer = duration;
    }
}
