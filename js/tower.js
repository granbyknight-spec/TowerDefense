// Tower (Dog) entities

class Tower {
    constructor(type, col, row, tileSize) {
        const def = CONFIG.TOWERS[type];
        this.type = type;
        this.name = def.name;
        this.col = col;
        this.row = row;
        this.tileSize = tileSize;

        const pos = gridToPixel(col, row, tileSize);
        this.x = pos.x;
        this.y = pos.y;

        this.cost = def.cost;
        this.totalInvested = def.cost;
        this.range = def.range;
        this.damage = def.damage;
        this.fireRate = def.fireRate;
        this.color = def.color;
        this.projectileColor = def.projectileColor;
        this.projectileSpeed = def.projectileSpeed;
        this.splash = def.splash;
        this.slow = def.slow;
        this.slowDuration = def.slowDuration || 0;
        this.emoji = def.emoji;
        this.description = def.description;

        this.level = 1;
        this.fireCooldown = 0;
        this.target = null;

        // Animation
        this.attackAnim = 0;
    }

    upgrade() {
        const upgradeCost = Math.floor(this.cost * CONFIG.UPGRADE_COST_MULT);
        this.level = 2;
        this.totalInvested += upgradeCost;
        this.range *= CONFIG.UPGRADE_STAT_MULT;
        this.damage = Math.floor(this.damage * CONFIG.UPGRADE_STAT_MULT);
        this.fireRate *= 0.8; // fires faster
        return upgradeCost;
    }

    getUpgradeCost() {
        return Math.floor(this.cost * CONFIG.UPGRADE_COST_MULT);
    }

    getSellValue() {
        return Math.floor(this.totalInvested * CONFIG.SELL_REFUND);
    }

    findTarget(enemies) {
        let closest = null;
        let closestDist = Infinity;
        const rangePx = this.range * this.tileSize;

        for (const enemy of enemies) {
            if (!enemy.alive || enemy.reachedEnd) continue;
            const d = dist(this.x, this.y, enemy.x, enemy.y);
            if (d <= rangePx && d < closestDist) {
                closest = enemy;
                closestDist = d;
            }
        }

        this.target = closest;
        return closest;
    }

    update(dt, enemies, projectiles) {
        this.fireCooldown -= dt;
        if (this.attackAnim > 0) this.attackAnim -= dt * 4;

        const target = this.findTarget(enemies);
        if (target && this.fireCooldown <= 0) {
            this.fireCooldown = this.fireRate;
            this.attackAnim = 1;
            Audio.shoot(this.type);

            projectiles.push(new Projectile(
                this.x, this.y,
                target,
                this.damage,
                this.projectileSpeed * this.tileSize,
                this.projectileColor,
                this.splash * this.tileSize,
                this.slow,
                this.slowDuration
            ));
        }
    }
}
