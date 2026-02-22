// Minimal sound - soft pop on enemy death only
// Procedural WAV synthesis, no Web Audio API dependency

const GameAudio = (() => {
    const SR = 22050;
    let urls = {};
    let muted = false;
    let volume = 0.5;

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
        v.setUint16(20, 1, true);
        v.setUint16(22, 1, true);
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

    function _tone(freq, type, dur, vol, freqEnd) {
        const n = (SR * dur) | 0;
        const out = new Float32Array(n);
        let phase = 0;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            const env = vol * (1 - t / dur) * (1 - t / dur); // quadratic fade for softness
            let f = freq;
            if (freqEnd) f = freq * Math.pow(Math.max(freqEnd, 20) / freq, t / dur);
            const s = Math.sin(phase);
            out[i] = s * env;
            phase += 2 * Math.PI * f / SR;
        }
        return out;
    }

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

    function _generateAll() {
        // Soft delightful pop - gentle rising sine with quick fade
        urls.pop = _toWavUrl(_mix([
            { samples: _tone(600, 'sine', 0.08, 0.25, 1200) },
            { samples: _tone(900, 'sine', 0.06, 0.15, 1400), offset: 0.02 }
        ]));

        // Gentle ability activation - subtle chime
        urls.ability = _toWavUrl(_mix([
            { samples: _tone(800, 'sine', 0.1, 0.15, 1200) },
            { samples: _tone(1000, 'sine', 0.08, 0.1, 1400), offset: 0.05 }
        ]));
    }

    function _play(name) {
        if (muted || !urls[name]) return;
        try {
            const a = new Audio(urls[name]);
            a.volume = volume;
            a.play().catch(() => {});
        } catch (e) {}
    }

    function init() {
        _generateAll();
    }

    function unlock() {
        try {
            const a = new Audio(urls.pop || '');
            a.volume = 0.01;
            a.play().catch(() => {});
        } catch (e) {}
    }

    // No-ops for removed sounds
    const noop = () => {};

    return {
        init,
        unlock,
        shoot: noop,
        enemyDeath:   () => _play('pop'),
        enemyEscape:  noop,
        waveStart:    noop,
        placeTower:   noop,
        upgradeTower: noop,
        sellTower:    noop,
        splash:       noop,
        gameOver:     noop,
        victory:      noop,
        buttonClick:  noop,
        goldEarned:   noop,
        ability:      () => _play('ability'),
        bossRoar:     noop,
        toggleMute:   () => { muted = !muted; return muted; },
        isMuted:      () => muted
    };
})();
