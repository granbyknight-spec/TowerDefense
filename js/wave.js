// Wave spawning system

class WaveManager {
    constructor() {
        this.currentWave = 0;
        this.waveDefs = this.generateWaves();
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.waveInProgress = false;
        this.allWavesComplete = false;
        this.betweenWaves = true;
        this.betweenWaveTimer = CONFIG.WAVE_DELAY;
    }

    generateWaves() {
        const waves = [];
        for (let i = 1; i <= CONFIG.TOTAL_WAVES; i++) {
            const wave = [];
            // Base count scales with wave number
            const baseCount = 3 + Math.floor(i * 1.5);

            if (i <= 5) {
                // Early: mostly kittens
                for (let j = 0; j < baseCount; j++) wave.push('kitten');
                if (i >= 3) {
                    for (let j = 0; j < Math.floor(i / 2); j++) wave.push('tabby');
                }
            } else if (i <= 12) {
                // Mid: mix of kitten and tabby, some fat cats
                for (let j = 0; j < Math.floor(baseCount * 0.4); j++) wave.push('kitten');
                for (let j = 0; j < Math.floor(baseCount * 0.4); j++) wave.push('tabby');
                if (i >= 8) {
                    for (let j = 0; j < Math.floor((i - 7) * 0.8); j++) wave.push('fatcat');
                }
            } else {
                // Late: heavy tabbies and fat cats
                for (let j = 0; j < Math.floor(baseCount * 0.2); j++) wave.push('kitten');
                for (let j = 0; j < Math.floor(baseCount * 0.4); j++) wave.push('tabby');
                for (let j = 0; j < Math.floor(baseCount * 0.3); j++) wave.push('fatcat');
            }

            // Final wave: fat cat swarm
            if (i === CONFIG.TOTAL_WAVES) {
                wave.length = 0;
                for (let j = 0; j < 15; j++) wave.push('fatcat');
                for (let j = 0; j < 10; j++) wave.push('tabby');
            }

            // Scale HP with wave number
            waves.push({
                enemies: wave,
                hpMultiplier: 1 + (i - 1) * 0.12
            });
        }
        return waves;
    }

    startNextWave() {
        if (this.currentWave >= CONFIG.TOTAL_WAVES) {
            this.allWavesComplete = true;
            return null;
        }

        const waveDef = this.waveDefs[this.currentWave];
        this.spawnQueue = waveDef.enemies.slice();
        this.spawnTimer = 0;
        this.waveInProgress = true;
        this.betweenWaves = false;
        this.currentWave++;

        return waveDef;
    }

    sendEarly() {
        if (this.betweenWaves) {
            this.betweenWaveTimer = 0;
            return true;
        }
        return false;
    }

    update(dt, path, tileSize, enemies) {
        if (this.allWavesComplete) return;

        if (this.betweenWaves) {
            this.betweenWaveTimer -= dt;
            if (this.betweenWaveTimer <= 0) {
                this.startNextWave();
            }
            return;
        }

        if (this.spawnQueue.length > 0) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                this.spawnTimer = CONFIG.SPAWN_INTERVAL;
                const type = this.spawnQueue.shift();
                if (path && path.length > 0) {
                    const enemy = new Enemy(type, path, tileSize);
                    // Apply wave HP scaling
                    const mult = this.waveDefs[this.currentWave - 1].hpMultiplier;
                    enemy.maxHp = Math.floor(enemy.maxHp * mult);
                    enemy.hp = enemy.maxHp;
                    enemies.push(enemy);
                }
            }
        }

        // Check if wave is done (no queue and no alive enemies)
        if (this.spawnQueue.length === 0 && this.waveInProgress) {
            const anyAlive = enemies.some(e => e.alive && !e.reachedEnd);
            if (!anyAlive) {
                this.waveInProgress = false;
                if (this.currentWave >= CONFIG.TOTAL_WAVES) {
                    this.allWavesComplete = true;
                } else {
                    this.betweenWaves = true;
                    this.betweenWaveTimer = CONFIG.WAVE_DELAY;
                }
            }
        }
    }

    getWaveDisplay() {
        return this.currentWave + ' / ' + CONFIG.TOTAL_WAVES;
    }

    getTimerDisplay() {
        if (this.betweenWaves) {
            return Math.ceil(this.betweenWaveTimer);
        }
        return null;
    }
}
