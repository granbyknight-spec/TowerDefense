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

        // Path following
        this.path = path.slice(); // copy
        this.pathIndex = 0;

        // Position in pixels (start at first path node)
        const start = gridToPixel(path[0].col, path[0].row, tileSize);
        this.x = start.x;
        this.y = start.y;

        // Slow effect
        this.slowTimer = 0;
        this.slowFactor = 1;

        // Animation
        this.wobble = 0;
        this.wobbleSpeed = 3 + Math.random() * 2;
    }

    updatePath(newPath) {
        if (!newPath || newPath.length === 0) return;

        // Find the closest point on the new path to current position
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

        // Update slow
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            this.speed = this.baseSpeed * this.slowFactor;
        } else {
            this.speed = this.baseSpeed;
        }

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
            if (this.pathIndex >= this.path.length) {
                this.reachedEnd = true;
            }
        } else {
            this.x += (dx / d) * moveSpeed;
            this.y += (dy / d) * moveSpeed;
        }

        // Wobble animation (cats sway as they walk)
        this.wobble += this.wobbleSpeed * dt;
    }

    takeDamage(amount) {
        const dmg = Math.max(1, amount - this.armor);
        this.hp -= dmg;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
    }

    applySlow(factor, duration) {
        this.slowFactor = factor;
        this.slowTimer = duration;
    }
}
