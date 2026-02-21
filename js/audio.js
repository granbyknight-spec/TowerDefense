// Procedural sound effects using Web Audio API
// Persistent unlock: retries on every gesture until context is running

const GameAudio = (() => {
    let ctx = null;
    let muted = false;
    let volume = 0.4;
    let unlockBound = false;

    function getCtx() {
        if (!ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            try { ctx = new AC(); } catch(e) { return null; }
        }
        return ctx;
    }

    // Tries to unlock on EVERY user gesture until the context is running.
    // Does NOT remove the listeners after one attempt.
    function _tryUnlock() {
        const c = getCtx();
        if (!c) return;
        if (c.state === 'running') {
            // Already good — remove listeners to save perf
            _removeUnlockListeners();
            return;
        }
        // Resume + play silent buffer (Safari needs both)
        try {
            c.resume().then(() => {
                if (c.state === 'running') _removeUnlockListeners();
            }).catch(() => {});
        } catch(e) {}
        try {
            const buf = c.createBuffer(1, 1, c.sampleRate);
            const src = c.createBufferSource();
            src.buffer = buf;
            src.connect(c.destination);
            src.start(0);
        } catch(e) {}
    }

    const _unlockEvents = ['touchstart', 'touchend', 'mousedown', 'click', 'keydown'];

    function _removeUnlockListeners() {
        _unlockEvents.forEach(e => document.removeEventListener(e, _tryUnlock, true));
        unlockBound = false;
    }

    function init() {
        if (unlockBound) return;
        unlockBound = true;
        _unlockEvents.forEach(e => document.addEventListener(e, _tryUnlock, true));
    }

    function _ensureRunning() {
        const c = getCtx();
        if (!c) return null;
        if (c.state !== 'running') {
            try { c.resume(); } catch(e) {}
        }
        return c;
    }

    function playTone(freq, type, duration, volMult, freqEnd) {
        if (muted) return;
        const c = _ensureRunning();
        if (!c) return;
        try {
            const now = c.currentTime;
            const osc = c.createOscillator();
            const gain = c.createGain();
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
            gain.connect(c.destination);
            osc.start(now);
            osc.stop(now + duration + 0.02);
        } catch(e) {}
    }

    function playNoise(duration, volMult) {
        if (muted) return;
        const c = _ensureRunning();
        if (!c) return;
        try {
            const now = c.currentTime;
            const len = Math.max(1, Math.floor(c.sampleRate * duration));
            const buffer = c.createBuffer(1, len, c.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < len; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / len);
            }
            const source = c.createBufferSource();
            source.buffer = buffer;
            const gain = c.createGain();
            const vol = volume * (volMult || 0.3);
            gain.gain.setValueAtTime(vol, now);
            gain.gain.linearRampToValueAtTime(0, now + duration);
            const filter = c.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1000;
            filter.Q.value = 0.5;
            source.connect(filter);
            filter.connect(gain);
            gain.connect(c.destination);
            source.start(now);
        } catch(e) {}
    }

    // === SOUND EFFECTS ===
    function shootBarker() {
        playTone(400, 'square', 0.1, 0.25, 200);
        playTone(350, 'sawtooth', 0.08, 0.1, 180);
    }
    function shootBigBoi() {
        playTone(180, 'sawtooth', 0.18, 0.3, 80);
        playTone(140, 'square', 0.15, 0.15, 60);
    }
    function shootPoodle() {
        playTone(700, 'sine', 0.08, 0.2, 500);
        playTone(900, 'triangle', 0.06, 0.1, 600);
    }
    function shoot(towerType) {
        if (towerType === 'barker') shootBarker();
        else if (towerType === 'bigboi') shootBigBoi();
        else if (towerType === 'poodle') shootPoodle();
    }
    function enemyDeath() {
        playTone(600, 'sine', 0.12, 0.3, 150);
        playNoise(0.08, 0.15);
    }
    function enemyEscape() {
        playTone(400, 'triangle', 0.15, 0.2);
        setTimeout(() => playTone(250, 'triangle', 0.2, 0.2), 120);
    }
    function waveStart() {
        playTone(500, 'sine', 0.12, 0.2, 700);
        setTimeout(() => playTone(700, 'sine', 0.15, 0.25, 900), 130);
    }
    function placeTower() {
        playTone(200, 'sine', 0.1, 0.3, 100);
        playTone(500, 'triangle', 0.08, 0.15);
    }
    function upgradeTower() {
        playTone(400, 'sine', 0.1, 0.2);
        setTimeout(() => playTone(550, 'sine', 0.1, 0.2), 80);
        setTimeout(() => playTone(700, 'sine', 0.15, 0.25), 160);
    }
    function sellTower() {
        playTone(1200, 'sine', 0.06, 0.15);
        setTimeout(() => playTone(1500, 'sine', 0.08, 0.15), 60);
    }
    function splash() {
        playTone(150, 'sawtooth', 0.15, 0.2, 40);
        playNoise(0.12, 0.25);
    }
    function gameOver() {
        [400, 350, 300, 200].forEach((freq, i) => {
            setTimeout(() => playTone(freq, 'triangle', 0.25, 0.25), i * 200);
        });
    }
    function victory() {
        [523, 659, 784, 1047].forEach((freq, i) => {
            setTimeout(() => {
                playTone(freq, 'sine', 0.2, 0.25);
                playTone(freq * 0.5, 'triangle', 0.2, 0.1);
            }, i * 150);
        });
    }
    function buttonClick() { playTone(800, 'sine', 0.04, 0.1); }
    function goldEarned() { playTone(1000, 'sine', 0.07, 0.12); }
    function toggleMute() { muted = !muted; return muted; }
    function isMuted() { return muted; }

    return {
        init, shoot, enemyDeath, enemyEscape, waveStart,
        placeTower, upgradeTower, sellTower, splash,
        gameOver, victory, buttonClick, goldEarned,
        toggleMute, isMuted
    };
})();
