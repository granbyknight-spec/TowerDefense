// Procedural sound effects using Web Audio API

const Audio = (() => {
    let ctx = null;
    let muted = false;
    let volume = 0.4;

    function ensureCtx() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        return ctx;
    }

    // Initialize audio context on first user interaction
    function init() {
        ['pointerdown', 'keydown'].forEach(evt => {
            document.addEventListener(evt, () => ensureCtx(), { once: true });
        });
    }

    function masterGain() {
        const c = ensureCtx();
        const g = c.createGain();
        g.gain.value = muted ? 0 : volume;
        g.connect(c.destination);
        return g;
    }

    // Helper: play an oscillator with envelope
    function playTone(freq, type, duration, volMult = 1, freqEnd = null) {
        if (muted) return;
        const c = ensureCtx();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, c.currentTime);
        if (freqEnd !== null) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), c.currentTime + duration);
        }
        gain.gain.setValueAtTime(volume * volMult, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + duration);
    }

    // Helper: noise burst for explosions
    function playNoise(duration, volMult = 0.3) {
        if (muted) return;
        const c = ensureCtx();
        const bufferSize = c.sampleRate * duration;
        const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const source = c.createBufferSource();
        source.buffer = buffer;
        const gain = c.createGain();
        gain.gain.setValueAtTime(volume * volMult, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

        // Bandpass for less harsh noise
        const filter = c.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 0.5;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);
        source.start(c.currentTime);
    }

    // === SOUND EFFECTS ===

    function shootBarker() {
        // Quick bark: square wave with fast pitch drop
        playTone(400, 'square', 0.1, 0.25, 200);
        playTone(350, 'sawtooth', 0.08, 0.1, 180);
    }

    function shootBigBoi() {
        // Deep bark: low growly sound
        playTone(180, 'sawtooth', 0.18, 0.3, 80);
        playTone(140, 'square', 0.15, 0.15, 60);
    }

    function shootPoodle() {
        // High yip
        playTone(700, 'sine', 0.08, 0.2, 500);
        playTone(900, 'triangle', 0.06, 0.1, 600);
    }

    function shoot(towerType) {
        if (towerType === 'barker') shootBarker();
        else if (towerType === 'bigboi') shootBigBoi();
        else if (towerType === 'poodle') shootPoodle();
    }

    function enemyDeath() {
        // Satisfying pop
        playTone(600, 'sine', 0.12, 0.3, 150);
        playNoise(0.08, 0.15);
    }

    function enemyEscape() {
        // Sad two-note descend
        playTone(400, 'triangle', 0.15, 0.2);
        setTimeout(() => playTone(250, 'triangle', 0.2, 0.2), 120);
    }

    function waveStart() {
        // Alert whistle: ascending two-tone
        playTone(500, 'sine', 0.12, 0.2, 700);
        setTimeout(() => playTone(700, 'sine', 0.15, 0.25, 900), 130);
    }

    function placeTower() {
        // Thud + confirmation
        playTone(200, 'sine', 0.1, 0.3, 100);
        playTone(500, 'triangle', 0.08, 0.15);
    }

    function upgradeTower() {
        // Power-up ascending arpeggio
        playTone(400, 'sine', 0.1, 0.2);
        setTimeout(() => playTone(550, 'sine', 0.1, 0.2), 80);
        setTimeout(() => playTone(700, 'sine', 0.15, 0.25), 160);
    }

    function sellTower() {
        // Coin clink
        playTone(1200, 'sine', 0.06, 0.15);
        setTimeout(() => playTone(1500, 'sine', 0.08, 0.15), 60);
    }

    function splash() {
        // Explosion boom
        playTone(150, 'sawtooth', 0.15, 0.2, 40);
        playNoise(0.12, 0.25);
    }

    function gameOver() {
        // Sad descending melody
        const notes = [400, 350, 300, 200];
        notes.forEach((freq, i) => {
            setTimeout(() => playTone(freq, 'triangle', 0.25, 0.25), i * 200);
        });
    }

    function victory() {
        // Happy ascending fanfare
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                playTone(freq, 'sine', 0.2, 0.25);
                playTone(freq * 0.5, 'triangle', 0.2, 0.1);
            }, i * 150);
        });
    }

    function buttonClick() {
        playTone(800, 'sine', 0.04, 0.1);
    }

    function goldEarned() {
        // Quick cheerful ding
        playTone(1000, 'sine', 0.07, 0.12);
    }

    function toggleMute() {
        muted = !muted;
        return muted;
    }

    function isMuted() {
        return muted;
    }

    return {
        init,
        shoot,
        enemyDeath,
        enemyEscape,
        waveStart,
        placeTower,
        upgradeTower,
        sellTower,
        splash,
        gameOver,
        victory,
        buttonClick,
        goldEarned,
        toggleMute,
        isMuted
    };
})();
