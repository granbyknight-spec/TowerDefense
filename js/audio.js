// Sound effects + procedural ambient background music per level
// All audio is synthesized as WAV blobs - no external files needed

const GameAudio = (() => {
    const SR = 22050;
    let urls = {};
    let muted = false;
    let volume = 0.5;

    // Background music state
    let bgMusic = null;
    let currentMusicLevel = -1;
    const musicVolume = 0.18;

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
            const env = vol * (1 - t / dur) * (1 - t / dur);
            let f = freq;
            if (freqEnd) f = freq * Math.pow(Math.max(freqEnd, 20) / freq, t / dur);
            const s = Math.sin(phase);
            out[i] = s * env;
            phase += 2 * Math.PI * f / SR;
        }
        return out;
    }

    // Soft pad tone - sine with gentle attack/release envelope
    function _pad(freq, dur, vol) {
        const n = (SR * dur) | 0;
        const out = new Float32Array(n);
        const attack = 0.3;
        const release = 0.4;
        let phase = 0;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            // Smooth envelope: fade in, sustain, fade out
            let env = vol;
            if (t < attack) env *= t / attack;
            if (t > dur - release) env *= (dur - t) / release;
            // Layered sines for warmth (fundamental + soft octave + fifth)
            const s = Math.sin(phase)
                    + 0.3 * Math.sin(phase * 2)
                    + 0.15 * Math.sin(phase * 1.5);
            out[i] = s * env * 0.5;
            phase += 2 * Math.PI * freq / SR;
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
        // Crossfade loop point: blend last 0.3s with first 0.3s for seamless loop
        const fadeLen = (SR * 0.3) | 0;
        if (out.length > fadeLen * 2) {
            for (let i = 0; i < fadeLen; i++) {
                const t = i / fadeLen;
                out[i] = out[i] * t + out[out.length - fadeLen + i] * (1 - t);
            }
            // Trim the crossfade tail
            const trimmed = new Float32Array(out.length - fadeLen);
            trimmed.set(out.subarray(0, trimmed.length));
            for (let i = 0; i < trimmed.length; i++) {
                trimmed[i] = Math.max(-1, Math.min(1, trimmed[i]));
            }
            return trimmed;
        }
        for (let i = 0; i < out.length; i++) {
            out[i] = Math.max(-1, Math.min(1, out[i]));
        }
        return out;
    }

    // Generate a music loop from a chord progression
    // chords: array of [freq1, freq2, freq3] (3-note chords)
    // beatDur: seconds per chord, vol: amplitude
    function _generateMusicLoop(chords, beatDur, vol) {
        const parts = [];
        for (let c = 0; c < chords.length; c++) {
            const chord = chords[c];
            const offset = c * beatDur;
            for (const freq of chord) {
                parts.push({ samples: _pad(freq, beatDur + 0.1, vol), offset });
            }
        }
        return _mix(parts);
    }

    function _generateAll() {
        // SFX
        urls.pop = _toWavUrl(_mix([
            { samples: _tone(600, 'sine', 0.08, 0.25, 1200) },
            { samples: _tone(900, 'sine', 0.06, 0.15, 1400), offset: 0.02 }
        ]));

        urls.ability = _toWavUrl(_mix([
            { samples: _tone(800, 'sine', 0.1, 0.15, 1200) },
            { samples: _tone(1000, 'sine', 0.08, 0.1, 1400), offset: 0.05 }
        ]));

        // Background music loops (one per level)
        // Note frequencies
        const C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.00, A4=440.00, B4=493.88;
        const C3=130.81, D3=146.83, E3=164.81, F3=174.61, G3=196.00, A3=220.00, B3=246.94;
        const Bb3=233.08, Eb4=311.13;

        // Level 1: The Backyard - warm, cheerful C major (C-Am-F-G)
        const v = 0.12;
        const bd = 3.0; // seconds per chord
        urls.music0 = _toWavUrl(_generateMusicLoop([
            [C3, E3, G3],     // C major
            [A3, C4, E4],     // A minor
            [F3, A3, C4],     // F major
            [G3, B3, D4],     // G major
        ], bd, v));

        // Level 2: The Park - cooler, more serious D minor (Dm-Bb-C-Am)
        urls.music1 = _toWavUrl(_generateMusicLoop([
            [D3, F3, A3],     // D minor
            [Bb3, D4, F4],    // Bb major
            [C3, E3, G3],     // C major
            [A3, C4, E4],     // A minor
        ], bd, v));

        // Level 3: Cat Central - tense, dramatic A minor (Am-F-Dm-E)
        urls.music2 = _toWavUrl(_generateMusicLoop([
            [A3, C4, E4],     // A minor
            [F3, A3, C4],     // F major
            [D3, F3, A3],     // D minor
            [E3, G3, B3],     // E minor (resolve tension gently)
        ], 2.5, v * 1.1));
    }

    function _play(name) {
        if (muted || !urls[name]) return;
        try {
            const a = new Audio(urls[name]);
            a.volume = volume;
            a.play().catch(() => {});
        } catch (e) {}
    }

    function _startMusic(level) {
        if (currentMusicLevel === level && bgMusic && !bgMusic.paused) return;
        _stopMusic();
        const key = 'music' + level;
        if (!urls[key]) return;
        currentMusicLevel = level;
        try {
            bgMusic = new Audio(urls[key]);
            bgMusic.loop = true;
            bgMusic.volume = muted ? 0 : musicVolume;
            bgMusic.play().catch(() => {});
        } catch (e) {}
    }

    function _stopMusic() {
        if (bgMusic) {
            bgMusic.pause();
            bgMusic.src = '';
            bgMusic = null;
        }
        currentMusicLevel = -1;
    }

    function _updateMusicMute() {
        if (bgMusic) {
            bgMusic.volume = muted ? 0 : musicVolume;
        }
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
        startMusic:   (level) => _startMusic(level),
        stopMusic:    () => _stopMusic(),
        toggleMute:   () => { muted = !muted; _updateMusicMute(); return muted; },
        isMuted:      () => muted
    };
})();
