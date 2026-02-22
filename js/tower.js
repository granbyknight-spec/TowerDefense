// Tower (Dog) entities with ability system

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

        // Ability system
        const abilDef = def.ability;
        if (abilDef) {
            this.abilityName = abilDef.name;
            this.abilityDesc = abilDef.desc;
            this.abilityCooldownMax = abilDef.cooldown;
            this.abilityDurationMax = abilDef.duration;
            this.abilityCooldown = 0; // 0 = ready
            this.abilityActive = false;
            this.abilityTimer = 0;
        } else {
            this.abilityName = null;
        }

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

        // Dog house: more gold per wave at higher levels
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

    canActivateAbility() {
        return this.abilityName && this.abilityCooldown <= 0 && !this.abilityActive;
    }

    activateAbility(enemies, particles) {
        if (!this.canActivateAbility()) return false;

        this.abilityActive = true;
        this.abilityTimer = this.abilityDurationMax;

        if (this.type === 'barker') {
            // BARK STORM: rapid fire for duration
            this.fireRate = 0.1;
            GameAudio.ability();
        } else if (this.type === 'poodle') {
            // ZOOMIES: slow all enemies on screen immediately
            for (const e of enemies) {
                if (e.alive && !e.reachedEnd) {
                    e.applySlow(0.2, 4);
                }
            }
            this.abilityActive = false;
            this.abilityCooldown = this.abilityCooldownMax;
            GameAudio.ability();
            // Visual burst
            if (particles) {
                for (let i = 0; i < 12; i++) {
                    const angle = (Math.PI * 2 / 12) * i;
                    particles.push({
                        x: this.x, y: this.y,
                        vx: Math.cos(angle) * 120,
                        vy: Math.sin(angle) * 120,
                        life: 0.6, maxLife: 0.6,
                        color: '#DA70D6', size: 6
                    });
                }
            }
        } else if (this.type === 'husky') {
            // BLIZZARD: freeze enemies in range
            const rangePx = this.range * this.tileSize;
            for (const e of enemies) {
                if (!e.alive || e.reachedEnd) continue;
                if (dist(this.x, this.y, e.x, e.y) <= rangePx) {
                    e.applyFreeze(2);
                }
            }
            this.abilityActive = false;
            this.abilityCooldown = this.abilityCooldownMax;
            GameAudio.ability();
            if (particles) {
                for (let i = 0; i < 16; i++) {
                    const angle = (Math.PI * 2 / 16) * i;
                    const r = rangePx * (0.3 + Math.random() * 0.7);
                    particles.push({
                        x: this.x + Math.cos(angle) * r,
                        y: this.y + Math.sin(angle) * r,
                        vx: (Math.random() - 0.5) * 20,
                        vy: -20 - Math.random() * 30,
                        life: 0.8, maxLife: 0.8,
                        color: '#B3E5FC', size: 5
                    });
                }
            }
        } else if (this.type === 'bigboi') {
            // MEGA WOOF: screen-wide damage nuke
            for (const e of enemies) {
                if (e.alive && !e.reachedEnd) {
                    e.takeDamage(100);
                }
            }
            this.abilityActive = false;
            this.abilityCooldown = this.abilityCooldownMax;
            GameAudio.ability();
            if (particles) {
                for (let i = 0; i < 20; i++) {
                    const angle = (Math.PI * 2 / 20) * i;
                    particles.push({
                        x: this.x, y: this.y,
                        vx: Math.cos(angle) * 200,
                        vy: Math.sin(angle) * 200,
                        life: 0.5, maxLife: 0.5,
                        color: '#FF6347', size: 8
                    });
                }
            }
        }

        return true;
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
        // Ability cooldown
        if (this.abilityCooldown > 0) {
            this.abilityCooldown -= dt;
            if (this.abilityCooldown < 0) this.abilityCooldown = 0;
        }

        // Bark Storm duration
        if (this.abilityActive && this.type === 'barker') {
            this.abilityTimer -= dt;
            if (this.abilityTimer <= 0) {
                this.abilityActive = false;
                this.fireRate = this._baseFireRate;
                this.abilityCooldown = this.abilityCooldownMax;
            }
        }

        if (this.isPassive) return;

        this.fireCooldown -= dt;
        if (this.attackAnim > 0) this.attackAnim -= dt * 4;

        const target = this.findTarget(enemies);
        if (target && this.fireCooldown <= 0) {
            this.fireCooldown = this.fireRate;
            this.attackAnim = 1;
            GameAudio.shoot(this.type);

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
