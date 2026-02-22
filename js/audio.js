// Sound effects + procedural ambient background music per level
// All audio is synthesized as WAV blobs - no external files needed

const GameAudio = (() => {
    const SR = 22050;
    let urls = {};
    let sfxMuted = false;
    let musicMuted = false;
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
            let env = vol;
            if (t < attack) env *= t / attack;
            if (t > dur - release) env *= (dur - t) / release;
            const s = Math.sin(phase)
                    + 0.3 * Math.sin(phase * 2)
                    + 0.15 * Math.sin(phase * 1.5);
            out[i] = s * env * 0.5;
            phase += 2 * Math.PI * freq / SR;
        }
        return out;
    }

    // Plucky melody note - sharp attack, quick decay
    function _pluck(freq, dur, vol) {
        const n = (SR * dur) | 0;
        const out = new Float32Array(n);
        let phase = 0;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            // Sharp pluck envelope
            const env = vol * Math.exp(-t * 6);
            // Triangle-ish wave + octave harmonic for brightness
            const s = Math.sin(phase) + 0.4 * Math.sin(phase * 2) + 0.2 * Math.sin(phase * 3);
            out[i] = s * env * 0.4;
            phase += 2 * Math.PI * freq / SR;
        }
        return out;
    }

    // Deeper bass note for level 3
    function _bass(freq, dur, vol) {
        const n = (SR * dur) | 0;
        const out = new Float32Array(n);
        let phase = 0;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            let env = vol;
            if (t < 0.05) env *= t / 0.05;
            if (t > dur - 0.2) env *= (dur - t) / 0.2;
            // Thick bass: fundamental + sub-octave
            const s = Math.sin(phase) + 0.6 * Math.sin(phase * 0.5);
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
        // Crossfade loop point
        const fadeLen = (SR * 0.3) | 0;
        if (out.length > fadeLen * 2) {
            for (let i = 0; i < fadeLen; i++) {
                const t = i / fadeLen;
                out[i] = out[i] * t + out[out.length - fadeLen + i] * (1 - t);
            }
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

    // Generate a music loop with chords + optional melody
    function _generateMusicLoop(chords, beatDur, vol, melody, melodyVol) {
        const parts = [];
        for (let c = 0; c < chords.length; c++) {
            const chord = chords[c];
            const offset = c * beatDur;
            for (const freq of chord) {
                parts.push({ samples: _pad(freq, beatDur + 0.1, vol), offset });
            }
        }
        // Add melody notes on top if provided
        if (melody) {
            for (const note of melody) {
                parts.push({
                    samples: (note.voice || _pluck)(note.freq, note.dur || 0.5, melodyVol || 0.1),
                    offset: note.offset
                });
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

        // Note frequencies
        const C5=523.25, D5=587.33, E5=659.26, F5=698.46, G5=783.99, A5=880.00, B5=987.77;
        const C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.00, A4=440.00, B4=493.88;
        const C3=130.81, D3=146.83, E3=164.81, F3=174.61, G3=196.00, A3=220.00, B3=246.94;
        const Bb3=233.08, Eb4=311.13, Ab3=207.65;

        // =======================================
        // Level 1: The Backyard - warm, cheerful, slow waltz feel
        // Key of C major, tempo ~72bpm (3.3s per chord)
        // =======================================
        const bd1 = 3.3;
        const v1 = 0.11;
        // Melody: simple ascending/descending C major scale fragments
        const melody1 = [
            { freq: E5, offset: 0.0, dur: 0.6 },
            { freq: G5, offset: 0.8, dur: 0.6 },
            { freq: C5, offset: 1.6, dur: 0.9 },
            // chord 2
            { freq: A4, offset: bd1 + 0.0, dur: 0.6 },
            { freq: C5, offset: bd1 + 0.8, dur: 0.6 },
            { freq: E5, offset: bd1 + 1.6, dur: 0.9 },
            // chord 3
            { freq: F5, offset: bd1*2 + 0.0, dur: 0.6 },
            { freq: A4, offset: bd1*2 + 0.8, dur: 0.6 },
            { freq: C5, offset: bd1*2 + 1.6, dur: 0.9 },
            // chord 4
            { freq: G5, offset: bd1*3 + 0.0, dur: 0.6 },
            { freq: D5, offset: bd1*3 + 0.8, dur: 0.6 },
            { freq: B4, offset: bd1*3 + 1.6, dur: 0.9 },
        ];
        urls.music0 = _toWavUrl(_generateMusicLoop([
            [C3, E3, G3],     // C major
            [A3, C4, E4],     // A minor
            [F3, A3, C4],     // F major
            [G3, B3, D4],     // G major
        ], bd1, v1, melody1, 0.08));

        // =======================================
        // Level 2: The Park - darker, medium tempo, minor key feel
        // Key of D minor, tempo ~90bpm (2.7s per chord)
        // =======================================
        const bd2 = 2.7;
        const v2 = 0.11;
        const melody2 = [
            { freq: D5, offset: 0.0, dur: 0.4 },
            { freq: F5, offset: 0.5, dur: 0.4 },
            { freq: A4, offset: 1.0, dur: 0.4 },
            { freq: D5, offset: 1.5, dur: 0.7 },
            // chord 2
            { freq: Bb3*2, offset: bd2 + 0.0, dur: 0.4 },  // Bb4
            { freq: D5, offset: bd2 + 0.5, dur: 0.4 },
            { freq: F5, offset: bd2 + 1.0, dur: 0.7 },
            // chord 3
            { freq: C5, offset: bd2*2 + 0.0, dur: 0.4 },
            { freq: E5, offset: bd2*2 + 0.5, dur: 0.4 },
            { freq: G5, offset: bd2*2 + 1.0, dur: 0.7 },
            // chord 4
            { freq: A4, offset: bd2*3 + 0.0, dur: 0.4 },
            { freq: C5, offset: bd2*3 + 0.5, dur: 0.4 },
            { freq: E5, offset: bd2*3 + 1.0, dur: 0.7 },
        ];
        urls.music1 = _toWavUrl(_generateMusicLoop([
            [D3, F3, A3],     // D minor
            [Bb3, D4, F4],    // Bb major
            [C3, E3, G3],     // C major
            [A3, C4, E4],     // A minor
        ], bd2, v2, melody2, 0.07));

        // =======================================
        // Level 3: Cat Central - tense, fast, dramatic
        // Key of A minor, tempo ~120bpm (2.0s per chord), added bass pulse
        // =======================================
        const bd3 = 2.0;
        const v3 = 0.12;
        // Urgent melody with quick notes
        const melody3 = [
            { freq: A4, offset: 0.0, dur: 0.25 },
            { freq: C5, offset: 0.25, dur: 0.25 },
            { freq: E5, offset: 0.5, dur: 0.25 },
            { freq: A5, offset: 0.75, dur: 0.5 },
            // chord 2
            { freq: F5, offset: bd3 + 0.0, dur: 0.25 },
            { freq: A4, offset: bd3 + 0.25, dur: 0.25 },
            { freq: C5, offset: bd3 + 0.5, dur: 0.25 },
            { freq: F5, offset: bd3 + 0.75, dur: 0.5 },
            // chord 3
            { freq: D5, offset: bd3*2 + 0.0, dur: 0.25 },
            { freq: F5, offset: bd3*2 + 0.25, dur: 0.25 },
            { freq: A4, offset: bd3*2 + 0.5, dur: 0.25 },
            { freq: D5, offset: bd3*2 + 0.75, dur: 0.5 },
            // chord 4
            { freq: E5, offset: bd3*3 + 0.0, dur: 0.25 },
            { freq: G5, offset: bd3*3 + 0.25, dur: 0.25 },
            { freq: B4, offset: bd3*3 + 0.5, dur: 0.25 },
            { freq: E5, offset: bd3*3 + 0.75, dur: 0.5 },
        ];
        // Add bass pulse every beat
        const bassPulse = [];
        const bassNotes = [A3, F3, D3, E3];
        for (let c = 0; c < 4; c++) {
            for (let b = 0; b < 4; b++) {
                bassPulse.push({
                    freq: bassNotes[c],
                    offset: c * bd3 + b * (bd3 / 4),
                    dur: bd3 / 4 - 0.05,
                    voice: _bass
                });
            }
        }
        const allMelody3 = melody3.concat(bassPulse);
        urls.music2 = _toWavUrl(_generateMusicLoop([
            [A3, C4, E4],     // A minor
            [F3, A3, C4],     // F major
            [D3, F3, A3],     // D minor
            [E3, G3, B3],     // E minor
        ], bd3, v3, allMelody3, 0.09));
    }

    function _play(name) {
        if (sfxMuted || !urls[name]) return;
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
            bgMusic.volume = musicMuted ? 0 : musicVolume;
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

    function _updateMusicVolume() {
        if (bgMusic) {
            bgMusic.volume = musicMuted ? 0 : musicVolume;
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
        toggleMute:   () => { sfxMuted = !sfxMuted; return sfxMuted; },
        isMuted:      () => sfxMuted,
        toggleMusic:  () => { musicMuted = !musicMuted; _updateMusicVolume(); return musicMuted; },
        isMusicMuted: () => musicMuted
    };
})();
