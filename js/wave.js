// Wave spawning system with level support and new enemy types

class WaveManager {
    constructor(startLevel) {
        this.currentLevel = startLevel || 0;
        this.currentWave = 0;
        this.waveDefs = this._generateWavesForLevel(this.currentLevel);
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.waveInProgress = false;
        this.allWavesComplete = false;
        this.levelComplete = false;
        this.betweenWaves = true;
        this.betweenWaveTimer = CONFIG.WAVE_DELAY;
    }

    _getLevelDef() {
        return CONFIG.LEVELS[this.currentLevel] || CONFIG.LEVELS[CONFIG.LEVELS.length - 1];
    }

    _generateWavesForLevel(levelIdx) {
        const level = CONFIG.LEVELS[levelIdx] || CONFIG.LEVELS[0];
        const waves = [];

        for (let i = 1; i <= level.waves; i++) {
            const wave = [];
            const baseCount = 3 + Math.floor(i * 1.3) + levelIdx * 2;
            const progress = i / level.waves; // 0→1 within level

            if (progress <= 0.4) {
                // Early: mostly kittens, sprinkle ninjas in later levels
                for (let j = 0; j < baseCount; j++) wave.push('kitten');
                if (progress > 0.2) {
                    for (let j = 0; j < Math.floor(i * 0.5); j++) wave.push('tabby');
                }
                if (levelIdx >= 1 && progress > 0.25) {
                    for (let j = 0; j < Math.floor(i * 0.3); j++) wave.push('ninja');
                }
            } else if (progress <= 0.75) {
                // Mid: mix with ninja cats
                for (let j = 0; j < Math.floor(baseCount * 0.3); j++) wave.push('kitten');
                for (let j = 0; j < Math.floor(baseCount * 0.35); j++) wave.push('tabby');
                if (levelIdx >= 0) {
                    for (let j = 0; j < Math.floor(baseCount * 0.15); j++) wave.push('ninja');
                }
                if (levelIdx >= 1) {
                    for (let j = 0; j < Math.floor(baseCount * 0.15); j++) wave.push('fatcat');
                }
                // Chonkers appear in mid-to-late waves
                if (levelIdx >= 1 && progress > 0.6) {
                    wave.push('chonker');
                }
            } else {
                // Late: heavy enemies
                for (let j = 0; j < Math.floor(baseCount * 0.15); j++) wave.push('kitten');
                for (let j = 0; j < Math.floor(baseCount * 0.3); j++) wave.push('tabby');
                for (let j = 0; j < Math.floor(baseCount * 0.15); j++) wave.push('ninja');
                for (let j = 0; j < Math.floor(baseCount * 0.2); j++) wave.push('fatcat');
                // Chonkers in late waves
                const chonkCount = 1 + levelIdx;
                for (let j = 0; j < chonkCount; j++) wave.push('chonker');
            }

            // Final wave: BOSS + escorts
            if (i === level.waves) {
                wave.push('boss');
                const escortCount = 2 + levelIdx * 3;
                for (let j = 0; j < escortCount; j++) wave.push('fatcat');
                for (let j = 0; j < escortCount; j++) wave.push('ninja');
            }

            waves.push({
                enemies: wave,
                hpMultiplier: level.hpScale * (1 + (i - 1) * 0.1),
                speedMultiplier: level.speedScale
            });
        }
        return waves;
    }

    getTotalWavesThisLevel() {
        return this._getLevelDef().waves;
    }

    startNextWave() {
        const totalWaves = this.getTotalWavesThisLevel();
        if (this.currentWave >= totalWaves) {
            if (this.currentLevel < CONFIG.LEVELS.length - 1) {
                this.levelComplete = true;
            } else {
                this.allWavesComplete = true;
            }
            return null;
        }

        const waveDef = this.waveDefs[this.currentWave];
        this.spawnQueue = waveDef.enemies.slice();
        this.spawnTimer = 0;
        this.waveInProgress = true;
        this.betweenWaves = false;
        this.currentWave++;
        GameAudio.waveStart();

        return waveDef;
    }

    startNextLevel() {
        this.currentLevel++;
        this.currentWave = 0;
        this.waveDefs = this._generateWavesForLevel(this.currentLevel);
        this.levelComplete = false;
        this.allWavesComplete = false;
        this.betweenWaves = true;
        this.betweenWaveTimer = CONFIG.WAVE_DELAY;
    }

    sendEarly() {
        if (this.betweenWaves) {
            this.betweenWaveTimer = 0;
            return true;
        }
        return false;
    }

    update(dt, path, tileSize, enemies) {
        if (this.allWavesComplete || this.levelComplete) return;

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
                // Boss spawns slower
                const type = this.spawnQueue.shift();
                this.spawnTimer = type === 'boss' ? 1.5 : CONFIG.SPAWN_INTERVAL;
                if (path && path.length > 0) {
                    const enemy = new Enemy(type, path, tileSize);
                    const waveDef = this.waveDefs[this.currentWave - 1];
                    enemy.maxHp = Math.floor(enemy.maxHp * waveDef.hpMultiplier);
                    enemy.hp = enemy.maxHp;
                    enemy.baseSpeed *= waveDef.speedMultiplier;
                    enemy.speed = enemy.baseSpeed;
                    enemies.push(enemy);
                }
            }
        }

        // Check if wave is done
        if (this.spawnQueue.length === 0 && this.waveInProgress) {
            const anyAlive = enemies.some(e => e.alive && !e.reachedEnd);
            if (!anyAlive) {
                this.waveInProgress = false;
                const totalWaves = this.getTotalWavesThisLevel();
                if (this.currentWave >= totalWaves) {
                    if (this.currentLevel < CONFIG.LEVELS.length - 1) {
                        this.levelComplete = true;
                    } else {
                        this.allWavesComplete = true;
                    }
                } else {
                    this.betweenWaves = true;
                    this.betweenWaveTimer = CONFIG.WAVE_DELAY;
                }
            }
        }
    }

    getWaveDisplay() {
        const total = this.getTotalWavesThisLevel();
        return this.currentWave + ' / ' + total;
    }

    getLevelDisplay() {
        const level = this._getLevelDef();
        return 'Lv' + (this.currentLevel + 1) + ': ' + level.name;
    }

    getTimerDisplay() {
        if (this.betweenWaves) {
            return Math.ceil(this.betweenWaveTimer);
        }
        return null;
    }
}
