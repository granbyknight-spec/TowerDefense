// Procedural sound effects using Web Audio API
// Audio context is created + resumed directly inside user click handlers via unlock()

const GameAudio = (() => {
    let ctx = null;
    let muted = false;
    let volume = 0.6;
    let unlocked = false;

    // MUST be called directly from a user gesture (click/tap handler)
    function unlock() {
        if (unlocked && ctx && ctx.state === 'running') return;
        try {
            if (!ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return;
                ctx = new AC();
            }
            // Resume — this MUST be in the synchronous call stack of a user gesture
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            // Play silent buffer (Safari requires actual audio output from gesture)
            const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(ctx.destination);
            src.start(0);
            unlocked = true;
        } catch(e) {}
    }

    function init() {
        // No-op — unlock is done explicitly via unlock() calls in button handlers
    }

    function playTone(freq, type, duration, volMult, freqEnd) {
        if (muted || !ctx) return;
        // Try to resume every time (belt and suspenders)
        if (ctx.state === 'suspended') {
            try { ctx.resume(); } catch(e) {}
        }
        try {
            const now = ctx.currentTime + 0.01;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);
            if (freqEnd != null) {
                osc.frequency.exponentialRampToValueAtTime(
                    Math.max(freqEnd, 20), now + duration
                );
            }
            const vol = volume * (volMult || 1);
            gain.gain.setValueAtTime(vol, now);
            gain.gain.linearRampToValueAtTime(0, now + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + duration + 0.02);
        } catch(e) {}
    }

    function playNoise(duration, volMult) {
        if (muted || !ctx) return;
        if (ctx.state === 'suspended') {
            try { ctx.resume(); } catch(e) {}
        }
        try {
            const now = ctx.currentTime + 0.01;
            const len = Math.max(1, Math.floor(ctx.sampleRate * duration));
            const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < len; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / len);
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const gain = ctx.createGain();
            const vol = volume * (volMult || 0.3);
            gain.gain.setValueAtTime(vol, now);
            gain.gain.linearRampToValueAtTime(0, now + duration);
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1000;
            filter.Q.value = 0.5;
            source.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            source.start(now);
        } catch(e) {}
    }

    // === SOUND EFFECTS ===
    function shootBarker() {
        playTone(400, 'square', 0.1, 0.4, 200);
        playTone(350, 'sawtooth', 0.08, 0.2, 180);
    }
    function shootBigBoi() {
        playTone(180, 'sawtooth', 0.18, 0.5, 80);
        playTone(140, 'square', 0.15, 0.25, 60);
    }
    function shootPoodle() {
        playTone(700, 'sine', 0.08, 0.35, 500);
        playTone(900, 'triangle', 0.06, 0.2, 600);
    }
    function shootHusky() {
        // Icy howl — low whoosh with high shimmer
        playTone(250, 'sine', 0.2, 0.35, 120);
        playTone(1200, 'triangle', 0.1, 0.15, 800);
    }
    function shoot(towerType) {
        if (towerType === 'barker') shootBarker();
        else if (towerType === 'bigboi') shootBigBoi();
        else if (towerType === 'poodle') shootPoodle();
        else if (towerType === 'husky') shootHusky();
    }
    function enemyDeath() {
        playTone(600, 'sine', 0.12, 0.5, 150);
        playNoise(0.08, 0.3);
    }
    function enemyEscape() {
        playTone(400, 'triangle', 0.15, 0.35);
        setTimeout(() => playTone(250, 'triangle', 0.2, 0.35), 120);
    }
    function waveStart() {
        playTone(500, 'sine', 0.12, 0.35, 700);
        setTimeout(() => playTone(700, 'sine', 0.15, 0.4, 900), 130);
    }
    function placeTower() {
        playTone(200, 'sine', 0.1, 0.5, 100);
        playTone(500, 'triangle', 0.08, 0.3);
    }
    function upgradeTower() {
        playTone(400, 'sine', 0.1, 0.35);
        setTimeout(() => playTone(550, 'sine', 0.1, 0.35), 80);
        setTimeout(() => playTone(700, 'sine', 0.15, 0.4), 160);
    }
    function sellTower() {
        playTone(1200, 'sine', 0.06, 0.3);
        setTimeout(() => playTone(1500, 'sine', 0.08, 0.3), 60);
    }
    function splash() {
        playTone(150, 'sawtooth', 0.15, 0.35, 40);
        playNoise(0.12, 0.4);
    }
    function gameOver() {
        [400, 350, 300, 200].forEach((freq, i) => {
            setTimeout(() => playTone(freq, 'triangle', 0.25, 0.4), i * 200);
        });
    }
    function victory() {
        [523, 659, 784, 1047].forEach((freq, i) => {
            setTimeout(() => {
                playTone(freq, 'sine', 0.2, 0.4);
                playTone(freq * 0.5, 'triangle', 0.2, 0.2);
            }, i * 150);
        });
    }
    function buttonClick() { playTone(800, 'sine', 0.04, 0.25); }
    function goldEarned() { playTone(1000, 'sine', 0.07, 0.25); }
    function toggleMute() { muted = !muted; return muted; }
    function isMuted() { return muted; }

    return {
        init, unlock, shoot, enemyDeath, enemyEscape, waveStart,
        placeTower, upgradeTower, sellTower, splash,
        gameOver, victory, buttonClick, goldEarned,
        toggleMute, isMuted
    };
})();
