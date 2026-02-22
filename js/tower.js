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

        // Chain lightning properties
        this.chainCount = def.chainCount || 0;
        this.chainRange = def.chainRange || 0;
        this.chainFalloff = def.chainFalloff || 0.6;

        // Dog House aura (set per-level from DOGHOUSE_TIERS)
        this.auraRange = 0;
        this.auraTier = 0; // index into DOGHOUSE_TIERS

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

        // Buff modifiers (reset each frame by game.js)
        this.buffDamageMult = 1;
        this.buffFireRateMult = 1;
        this.buffRange = 0;
        this.isBuffed = false;
    }

    upgrade() {
        const maxLevel = CONFIG.MAX_TOWER_LEVEL || 4;
        if (this.level >= maxLevel) return 0;

        const upgradeCost = this.getUpgradeCost();
        this.level++;
        this.totalInvested += upgradeCost;

        // Dog House: use tier-based upgrades
        if (this.isPassive && CONFIG.DOGHOUSE_TIERS) {
            const tier = CONFIG.DOGHOUSE_TIERS[this.level - 1];
            if (tier) {
                this.goldPerWave = tier.goldPerWave;
                this.auraRange = tier.auraRange;
                this.auraTier = this.level - 1;
            }
            return upgradeCost;
        }

        const mult = CONFIG.UPGRADE_STAT_MULT;
        this.range *= mult;
        this.damage = Math.floor(this.damage * mult);
        this.fireRate *= 0.85;
        this._baseFireRate = this.fireRate;

        if (this.slow > 0 && this.slowDuration > 0) {
            this.slowDuration += 0.3;
            this.slow = Math.max(0.2, this.slow - 0.05);
        }

        // Chain lightning: extra chain per 2 levels
        if (this.chainCount > 0 && this.level % 2 === 0) {
            this.chainCount++;
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
        const effectiveRange = this.range + this.buffRange;
        const rangePx = effectiveRange * this.tileSize;

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
        const effectiveFireRate = this.fireRate * this.buffFireRateMult;
        if (target && this.fireCooldown <= 0) {
            this.fireCooldown = effectiveFireRate;
            this.attackAnim = 1;

            const effectiveDamage = Math.floor(this.damage * this.buffDamageMult);

            const proj = new Projectile(
                this.x, this.y,
                target,
                effectiveDamage,
                this.projectileSpeed * this.tileSize,
                this.projectileColor,
                this.splash * this.tileSize,
                this.slow,
                this.slowDuration
            );

            // Chain lightning
            if (this.chainCount > 0) {
                proj.chainCount = this.abilityActive ? this.chainCount * 2 : this.chainCount;
                proj.chainRange = this.chainRange * this.tileSize;
                proj.chainFalloff = this.chainFalloff;
                proj.chainArcs = []; // rendered by renderer
            }

            projectiles.push(proj);
        }
    }
}
