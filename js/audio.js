// Procedural sound via pre-generated WAV blobs + HTML5 Audio elements
// No Web Audio API dependency — maximum browser compatibility
// All sounds are synthesized as WAV at startup, then played via new Audio(url)

const GameAudio = (() => {
    const SR = 22050; // sample rate
    let urls = {};
    let muted = false;
    let volume = 0.7;

    // === WAV ENCODER ===
    function _writeStr(v, off, s) {
        for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
    }

    function _toWavUrl(samples) {
        const n = samples.length;
        const buf = new ArrayBuffer(44 + n * 2);
        const v = new DataView(buf);
        _writeStr(v, 0, 'RIFF');
        v.setUint32(4, 36 + n * 2, true);
        _writeStr(v, 8, 'WAVE');
        _writeStr(v, 12, 'fmt ');
        v.setUint32(16, 16, true);
        v.setUint16(20, 1, true);   // PCM
        v.setUint16(22, 1, true);   // mono
        v.setUint32(24, SR, true);
        v.setUint32(28, SR * 2, true);
        v.setUint16(32, 2, true);
        v.setUint16(34, 16, true);
        _writeStr(v, 36, 'data');
        v.setUint32(40, n * 2, true);
        for (let i = 0; i < n; i++) {
            v.setInt16(44 + i * 2, (Math.max(-1, Math.min(1, samples[i])) * 0x7FFF) | 0, true);
        }
        return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
    }

    // === SYNTHESIZERS (pure math, no AudioContext) ===
    function _tone(freq, type, dur, vol, freqEnd) {
        const n = (SR * dur) | 0;
        const out = new Float32Array(n);
        let phase = 0;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            const env = vol * (1 - t / dur);
            let f = freq;
            if (freqEnd) f = freq * Math.pow(Math.max(freqEnd, 20) / freq, t / dur);

            const p = (phase / (2 * Math.PI)) % 1;
            let s;
            switch (type) {
                case 'square': s = Math.sin(phase) > 0 ? 1 : -1; break;
                case 'sawtooth': s = 2 * p - 1; break;
                case 'triangle': s = 4 * Math.abs(p - 0.5) - 1; break;
                default: s = Math.sin(phase); // sine
            }
            out[i] = s * env;
            phase += 2 * Math.PI * f / SR;
        }
        return out;
    }

    function _noise(dur, vol) {
        const n = (SR * dur) | 0;
        const out = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            out[i] = (Math.random() * 2 - 1) * vol * (1 - i / n);
        }
        return out;
    }

    // Mix multiple sample arrays at time offsets (in seconds)
    function _mix(parts) {
        let maxLen = 0;
        for (const p of parts) {
            const off = ((p.offset || 0) * SR) | 0;
            maxLen = Math.max(maxLen, off + p.samples.length);
        }
        const out = new Float32Array(maxLen);
        for (const p of parts) {
            const off = ((p.offset || 0) * SR) | 0;
            const s = p.samples;
            for (let i = 0; i < s.length && off + i < maxLen; i++) {
                out[off + i] += s[i];
            }
        }
        for (let i = 0; i < out.length; i++) {
            out[i] = Math.max(-1, Math.min(1, out[i]));
        }
        return out;
    }

    // === PRE-GENERATE ALL SOUNDS ===
    function _generateAll() {
        urls.shootBarker = _toWavUrl(_mix([
            { samples: _tone(400, 'square', 0.1, 0.4, 200) },
            { samples: _tone(350, 'sawtooth', 0.08, 0.2, 180) }
        ]));
        urls.shootBigBoi = _toWavUrl(_mix([
            { samples: _tone(180, 'sawtooth', 0.18, 0.5, 80) },
            { samples: _tone(140, 'square', 0.15, 0.25, 60) }
        ]));
        urls.shootPoodle = _toWavUrl(_mix([
            { samples: _tone(700, 'sine', 0.08, 0.35, 500) },
            { samples: _tone(900, 'triangle', 0.06, 0.2, 600) }
        ]));
        urls.shootHusky = _toWavUrl(_mix([
            { samples: _tone(250, 'sine', 0.2, 0.35, 120) },
            { samples: _tone(1200, 'triangle', 0.1, 0.15, 800) }
        ]));
        urls.enemyDeath = _toWavUrl(_mix([
            { samples: _tone(600, 'sine', 0.12, 0.5, 150) },
            { samples: _noise(0.08, 0.3) }
        ]));
        urls.enemyEscape = _toWavUrl(_mix([
            { samples: _tone(400, 'triangle', 0.15, 0.35) },
            { samples: _tone(250, 'triangle', 0.2, 0.35), offset: 0.12 }
        ]));
        urls.waveStart = _toWavUrl(_mix([
            { samples: _tone(500, 'sine', 0.12, 0.35, 700) },
            { samples: _tone(700, 'sine', 0.15, 0.4, 900), offset: 0.13 }
        ]));
        urls.placeTower = _toWavUrl(_mix([
            { samples: _tone(200, 'sine', 0.1, 0.5, 100) },
            { samples: _tone(500, 'triangle', 0.08, 0.3) }
        ]));
        urls.upgradeTower = _toWavUrl(_mix([
            { samples: _tone(400, 'sine', 0.1, 0.35) },
            { samples: _tone(550, 'sine', 0.1, 0.35), offset: 0.08 },
            { samples: _tone(700, 'sine', 0.15, 0.4), offset: 0.16 }
        ]));
        urls.sellTower = _toWavUrl(_mix([
            { samples: _tone(1200, 'sine', 0.06, 0.3) },
            { samples: _tone(1500, 'sine', 0.08, 0.3), offset: 0.06 }
        ]));
        urls.splash = _toWavUrl(_mix([
            { samples: _tone(150, 'sawtooth', 0.15, 0.35, 40) },
            { samples: _noise(0.12, 0.4) }
        ]));
        urls.gameOver = _toWavUrl(_mix([
            { samples: _tone(400, 'triangle', 0.25, 0.4) },
            { samples: _tone(350, 'triangle', 0.25, 0.4), offset: 0.2 },
            { samples: _tone(300, 'triangle', 0.25, 0.4), offset: 0.4 },
            { samples: _tone(200, 'triangle', 0.25, 0.4), offset: 0.6 }
        ]));
        urls.victory = _toWavUrl(_mix([
            { samples: _tone(523, 'sine', 0.2, 0.4) },
            { samples: _tone(262, 'triangle', 0.2, 0.2) },
            { samples: _tone(659, 'sine', 0.2, 0.4), offset: 0.15 },
            { samples: _tone(330, 'triangle', 0.2, 0.2), offset: 0.15 },
            { samples: _tone(784, 'sine', 0.2, 0.4), offset: 0.30 },
            { samples: _tone(392, 'triangle', 0.2, 0.2), offset: 0.30 },
            { samples: _tone(1047, 'sine', 0.2, 0.4), offset: 0.45 },
            { samples: _tone(524, 'triangle', 0.2, 0.2), offset: 0.45 }
        ]));
        urls.buttonClick = _toWavUrl(_tone(800, 'sine', 0.04, 0.25));
        urls.goldEarned = _toWavUrl(_tone(1000, 'sine', 0.07, 0.25));
        // Ability activation: dramatic rising chord
        urls.ability = _toWavUrl(_mix([
            { samples: _tone(300, 'sine', 0.15, 0.4, 600) },
            { samples: _tone(450, 'triangle', 0.12, 0.3, 900) },
            { samples: _tone(600, 'square', 0.1, 0.2, 1200), offset: 0.05 }
        ]));
        // Boss roar: low rumble
        urls.bossRoar = _toWavUrl(_mix([
            { samples: _tone(80, 'sawtooth', 0.4, 0.5, 40) },
            { samples: _noise(0.3, 0.35) },
            { samples: _tone(120, 'square', 0.3, 0.3, 50), offset: 0.1 }
        ]));
    }

    // === PLAYBACK via HTML5 Audio ===
    function _play(name) {
        if (muted || !urls[name]) return;
        try {
            const a = new Audio(urls[name]);
            a.volume = volume;
            a.play().catch(() => {});
        } catch (e) {}
    }

    // Called at page load — generates all WAV blobs
    function init() {
        _generateAll();
    }

    // Called from button click handlers — plays silent audio to unlock iOS
    function unlock() {
        try {
            const a = new Audio(urls.buttonClick || '');
            a.volume = 0.01;
            a.play().catch(() => {});
        } catch (e) {}
    }

    function shoot(type) {
        if (type === 'barker') _play('shootBarker');
        else if (type === 'bigboi') _play('shootBigBoi');
        else if (type === 'poodle') _play('shootPoodle');
        else if (type === 'husky') _play('shootHusky');
    }

    return {
        init,
        unlock,
        shoot,
        enemyDeath:   () => _play('enemyDeath'),
        enemyEscape:  () => _play('enemyEscape'),
        waveStart:    () => _play('waveStart'),
        placeTower:   () => _play('placeTower'),
        upgradeTower: () => _play('upgradeTower'),
        sellTower:    () => _play('sellTower'),
        splash:       () => _play('splash'),
        gameOver:     () => _play('gameOver'),
        victory:      () => _play('victory'),
        buttonClick:  () => _play('buttonClick'),
        goldEarned:   () => _play('goldEarned'),
        ability:      () => _play('ability'),
        bossRoar:     () => _play('bossRoar'),
        toggleMute:   () => { muted = !muted; return muted; },
        isMuted:      () => muted
    };
})();
