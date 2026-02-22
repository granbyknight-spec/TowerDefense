// Tower (Dog) entities — abilities are activated globally by game.js

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
        this.isPassive = def.isPassive || false;
        this.goldPerWave = def.goldPerWave || 0;

        this.level = 1;
        this.fireCooldown = 0;
        this.target = null;

        // Animation
        this.attackAnim = 0;

        // Ability flag (set by game.js global ability system)
        this.abilityActive = false;
        this.abilityName = def.ability ? def.ability.name : null;

        // Bark Storm: saved original fireRate
        this._baseFireRate = def.fireRate;
    }

    upgrade() {
        const maxLevel = CONFIG.MAX_TOWER_LEVEL || 4;
        if (this.level >= maxLevel) return 0;

        const upgradeCost = this.getUpgradeCost();
        this.level++;
        this.totalInvested += upgradeCost;

        const mult = CONFIG.UPGRADE_STAT_MULT;
        this.range *= mult;
        this.damage = Math.floor(this.damage * mult);
        this.fireRate *= 0.85;
        this._baseFireRate = this.fireRate;

        if (this.slow > 0 && this.slowDuration > 0) {
            this.slowDuration += 0.3;
            this.slow = Math.max(0.2, this.slow - 0.05);
        }

        if (this.goldPerWave > 0) {
            this.goldPerWave = Math.floor(this.goldPerWave * mult);
        }

        return upgradeCost;
    }

    getUpgradeCost() {
        return Math.floor(this.cost * CONFIG.UPGRADE_COST_MULT * this.level);
    }

    getSellValue() {
        return Math.floor(this.totalInvested * CONFIG.SELL_REFUND);
    }

    // Called by game.js when global ability activates
    startAbility() {
        this.abilityActive = true;
        if (this.type === 'barker') {
            this.fireRate = 0.1;
        }
    }

    // Called by game.js when global ability expires
    stopAbility() {
        this.abilityActive = false;
        if (this.type === 'barker') {
            this.fireRate = this._baseFireRate;
        }
    }

    findTarget(enemies) {
        if (this.isPassive) return null;

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
        if (this.isPassive) return;

        this.fireCooldown -= dt;
        if (this.attackAnim > 0) this.attackAnim -= dt * 4;

        const target = this.findTarget(enemies);
        if (target && this.fireCooldown <= 0) {
            this.fireCooldown = this.fireRate;
            this.attackAnim = 1;

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
