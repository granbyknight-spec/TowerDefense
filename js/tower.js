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

        // Super tower (set via makeSuper)
        this.isSuper = false;
        this.superPerk = null;
        this.superAnim = 0; // merge flash animation
    }

    upgrade() {
        if (this.isSuper) return 0; // super towers can't upgrade further
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

    makeSuper(combinedInvestment) {
        const superDef = CONFIG.SUPER_TOWERS[this.type];
        if (!superDef) return;

        this.isSuper = true;
        this.superPerk = superDef.perk;
        this.superAnim = 1.5; // flash timer
        this.level = 5; // display level
        this.totalInvested = combinedInvestment;

        this.name = superDef.name;
        this.emoji = superDef.emoji;
        this.color = superDef.color;
        this.description = superDef.description;

        if (this.isPassive) {
            // Dog Mansion
            this.goldPerWave = superDef.goldPerWave;
            this.auraRange = superDef.auraRange;
            this.auraTier = 4; // special tier index
        } else {
            this.damage = superDef.damage;
            this.range = superDef.range;
            this.fireRate = superDef.fireRate;
            this._baseFireRate = superDef.fireRate;
            this.projectileColor = superDef.projectileColor;
            this.projectileSpeed = superDef.projectileSpeed;
            this.splash = superDef.splash;
            this.slow = superDef.slow;
            this.slowDuration = superDef.slowDuration || 0;
            this.chainCount = superDef.chainCount || 0;
            this.chainRange = superDef.chainRange || 0;
            this.chainFalloff = superDef.chainFalloff || 0.6;
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
        if (this.superAnim > 0) this.superAnim -= dt;

        this.fireCooldown -= dt;
        if (this.attackAnim > 0) this.attackAnim -= dt * 4;

        // Frost Zone super perk: damage/slow all enemies in range each tick
        if (this.superPerk === 'frostZone') {
            if (this.fireCooldown <= 0) {
                this.fireCooldown = this.fireRate * this.buffFireRateMult;
                const rangePx = (this.range + this.buffRange) * this.tileSize;
                const dmg = Math.floor(this.damage * this.buffDamageMult);
                for (const e of enemies) {
                    if (!e.alive || e.reachedEnd) continue;
                    if (dist(this.x, this.y, e.x, e.y) <= rangePx) {
                        e.takeDamage(dmg);
                        e.applySlow(this.slow, this.slowDuration);
                    }
                }
                this.attackAnim = 0.5;
            }
            return;
        }

        const target = this.findTarget(enemies);
        const effectiveFireRate = this.fireRate * this.buffFireRateMult;
        if (target && this.fireCooldown <= 0) {
            this.fireCooldown = effectiveFireRate;
            this.attackAnim = 1;

            const effectiveDamage = Math.floor(this.damage * this.buffDamageMult);

            // Triple Shot super perk: fire 3 projectiles in a spread
            const shotCount = this.superPerk === 'tripleShot' ? 3 : 1;
            const spreadAngle = 0.25; // radians between spread shots

            for (let s = 0; s < shotCount; s++) {
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

                // Stun super perk
                if (this.superPerk === 'stun') {
                    proj.stunDuration = 1.0;
                }

                // Freeze blast super perk
                if (this.superPerk === 'freezeBlast') {
                    proj.freezeDuration = 1.5;
                }

                // Spread offset for triple shot
                if (shotCount > 1) {
                    const angle = (s - 1) * spreadAngle;
                    const dx = target.x - this.x;
                    const dy = target.y - this.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    const offset = d * Math.tan(angle);
                    const perpX = -dy / d;
                    const perpY = dx / d;
                    proj.targetX += perpX * offset;
                    proj.targetY += perpY * offset;
                }

                // Chain lightning
                if (this.chainCount > 0) {
                    proj.chainCount = this.abilityActive ? this.chainCount * 2 : this.chainCount;
                    proj.chainRange = this.chainRange * this.tileSize;
                    proj.chainFalloff = this.chainFalloff;
                    proj.chainArcs = [];
                }

                projectiles.push(proj);
            }
        }
    }
}
