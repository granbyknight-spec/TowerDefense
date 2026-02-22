// Sound effects + procedural background music per level
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

    // === WAVEFORM GENERATORS ===

    function _tone(freq, type, dur, vol, freqEnd) {
        const n = (SR * dur) | 0;
        const out = new Float32Array(n);
        let phase = 0;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            const env = vol * (1 - t / dur) * (1 - t / dur);
            let f = freq;
            if (freqEnd) f = freq * Math.pow(Math.max(freqEnd, 20) / freq, t / dur);
            out[i] = Math.sin(phase) * env;
            phase += 2 * Math.PI * f / SR;
        }
        return out;
    }

    // Soft pad - warm sine + harmonics with slow attack/release
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

    // Saw pad - richer/buzzier for level 2 atmosphere
    function _sawPad(freq, dur, vol) {
        const n = (SR * dur) | 0;
        const out = new Float32Array(n);
        const attack = 0.4;
        const release = 0.5;
        let phase = 0;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            let env = vol;
            if (t < attack) env *= t / attack;
            if (t > dur - release) env *= (dur - t) / release;
            // Band-limited saw approximation (5 harmonics)
            let s = 0;
            for (let h = 1; h <= 5; h++) {
                s += Math.sin(phase * h) / h * (h % 2 === 0 ? -1 : 1);
            }
            out[i] = s * env * 0.35;
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
            const env = vol * Math.exp(-t * 6);
            const s = Math.sin(phase) + 0.4 * Math.sin(phase * 2) + 0.2 * Math.sin(phase * 3);
            out[i] = s * env * 0.4;
            phase += 2 * Math.PI * freq / SR;
        }
        return out;
    }

    // Bright lead - triangle wave with vibrato for melodies
    function _lead(freq, dur, vol) {
        const n = (SR * dur) | 0;
        const out = new Float32Array(n);
        let phase = 0;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            let env = vol;
            if (t < 0.02) env *= t / 0.02;
            if (t > dur - 0.1) env *= (dur - t) / 0.1;
            // Vibrato
            const vib = 1 + Math.sin(t * 5.5 * Math.PI * 2) * 0.006;
            const f = freq * vib;
            // Triangle wave approximation
            const p = (phase / (2 * Math.PI)) % 1;
            const tri = 4 * Math.abs(p - 0.5) - 1;
            out[i] = tri * env * 0.35;
            phase += 2 * Math.PI * f / SR;
        }
        return out;
    }

    // Arpeggio note - short, bright, percussive
    function _arp(freq, dur, vol) {
        const n = (SR * dur) | 0;
        const out = new Float32Array(n);
        let phase = 0;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            const env = vol * Math.exp(-t * 10);
            const s = Math.sin(phase) + 0.5 * Math.sin(phase * 2) + 0.3 * Math.sin(phase * 4);
            out[i] = s * env * 0.3;
            phase += 2 * Math.PI * freq / SR;
        }
        return out;
    }

    // Bass - thick with sub-octave
    function _bass(freq, dur, vol) {
        const n = (SR * dur) | 0;
        const out = new Float32Array(n);
        let phase = 0;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            let env = vol;
            if (t < 0.05) env *= t / 0.05;
            if (t > dur - 0.15) env *= (dur - t) / 0.15;
            const s = Math.sin(phase) + 0.6 * Math.sin(phase * 0.5);
            out[i] = s * env * 0.5;
            phase += 2 * Math.PI * freq / SR;
        }
        return out;
    }

    // Slide bass - portamento between two frequencies
    function _slideBass(freq, freqEnd, dur, vol) {
        const n = (SR * dur) | 0;
        const out = new Float32Array(n);
        let phase = 0;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            let env = vol;
            if (t < 0.03) env *= t / 0.03;
            if (t > dur - 0.1) env *= (dur - t) / 0.1;
            const f = freq + (freqEnd - freq) * (t / dur);
            const s = Math.sin(phase) + 0.5 * Math.sin(phase * 0.5);
            out[i] = s * env * 0.5;
            phase += 2 * Math.PI * f / SR;
        }
        return out;
    }

    // === DRUM SYNTHESIS ===

    // Kick drum - sine sweep from ~150Hz down to ~40Hz
    function _kick(dur, vol) {
        const n = (SR * dur) | 0;
        const out = new Float32Array(n);
        let phase = 0;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            const env = vol * Math.exp(-t * 8);
            // Frequency sweep: sharp pitch drop
            const f = 40 + 110 * Math.exp(-t * 30);
            out[i] = Math.sin(phase) * env;
            phase += 2 * Math.PI * f / SR;
        }
        return out;
    }

    // Snare - noise burst + tonal body
    function _snare(dur, vol) {
        const n = (SR * dur) | 0;
        const out = new Float32Array(n);
        let phase = 0;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            const noiseEnv = vol * Math.exp(-t * 15);
            const toneEnv = vol * Math.exp(-t * 25);
            const noise = (Math.random() * 2 - 1) * noiseEnv * 0.6;
            const tone = Math.sin(phase) * toneEnv * 0.4;
            out[i] = noise + tone;
            phase += 2 * Math.PI * 180 / SR;
        }
        return out;
    }

    // Hi-hat - filtered noise, very short
    function _hihat(dur, vol) {
        const n = (SR * dur) | 0;
        const out = new Float32Array(n);
        // Simple high-pass via differencing
        let prev = 0;
        for (let i = 0; i < n; i++) {
            const t = i / SR;
            const env = vol * Math.exp(-t * (dur < 0.06 ? 40 : 18));
            const raw = (Math.random() * 2 - 1) * env;
            out[i] = (raw - prev) * 0.8;
            prev = raw;
        }
        return out;
    }

    // Open hi-hat - longer ring
    function _openHat(dur, vol) {
        return _hihat(dur, vol);
    }

    // === MIXER ===
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

    // Helper: build drum pattern from a simple grid
    // pattern: array of {beat, type} where type is 'kick'|'snare'|'hat'|'openhat'
    function _buildDrums(pattern, beatDur, numBeats, vol) {
        const parts = [];
        for (const hit of pattern) {
            const offset = hit.beat * beatDur;
            const v = (hit.vol || 1) * vol;
            switch (hit.type) {
                case 'kick':   parts.push({ samples: _kick(0.2, v), offset }); break;
                case 'snare':  parts.push({ samples: _snare(0.15, v * 0.7), offset }); break;
                case 'hat':    parts.push({ samples: _hihat(0.05, v * 0.4), offset }); break;
                case 'openhat':parts.push({ samples: _openHat(0.15, v * 0.5), offset }); break;
            }
        }
        return parts;
    }

    // Helper: generate arpeggio pattern over chord tones
    function _buildArp(chordFreqs, startOffset, beatDur, noteLen, vol) {
        const parts = [];
        const steps = Math.floor(beatDur / noteLen);
        for (let i = 0; i < steps; i++) {
            const freq = chordFreqs[i % chordFreqs.length];
            parts.push({
                samples: _arp(freq, noteLen * 0.9, vol),
                offset: startOffset + i * noteLen
            });
        }
        return parts;
    }

    // Helper: duplicate a set of parts shifted by a time offset
    function _offsetParts(parts, dt) {
        return parts.map(p => ({
            samples: p.samples,
            offset: (p.offset || 0) + dt
        }));
    }

    // Helper: build pads + bass + drums for a chord cycle (reusable base layer)
    function _buildBase(chords, barDur, beatDur, padVol, padFn, bassNotes, bassVol, drumFn) {
        const parts = [];
        // Pads
        for (let c = 0; c < chords.length; c++) {
            const offset = c * barDur;
            for (const freq of chords[c]) {
                parts.push({ samples: padFn(freq, barDur + 0.1, padVol), offset });
            }
        }
        // Bass
        for (const note of bassNotes) {
            if (note.slide) {
                parts.push({ samples: _slideBass(note.freq, note.slide, note.dur || beatDur * 0.8, bassVol), offset: note.offset });
            } else {
                parts.push({ samples: _bass(note.freq, note.dur || beatDur * 0.9, bassVol), offset: note.offset });
            }
        }
        // Drums
        if (drumFn) parts.push(...drumFn());
        return parts;
    }

    function _generateAll() {
        // === SFX ===
        urls.pop = _toWavUrl(_mix([
            { samples: _tone(600, 'sine', 0.08, 0.25, 1200) },
            { samples: _tone(900, 'sine', 0.06, 0.15, 1400), offset: 0.02 }
        ]));

        urls.ability = _toWavUrl(_mix([
            { samples: _tone(800, 'sine', 0.1, 0.15, 1200) },
            { samples: _tone(1000, 'sine', 0.08, 0.1, 1400), offset: 0.05 }
        ]));

        urls.shoot = _toWavUrl(_mix([
            { samples: _tone(400, 'sine', 0.04, 0.12, 800) }
        ]));

        urls.place = _toWavUrl(_mix([
            { samples: _tone(300, 'sine', 0.06, 0.15, 500) },
            { samples: _tone(500, 'sine', 0.05, 0.1, 700), offset: 0.03 }
        ]));

        // Note frequencies
        const C5=523.25, D5=587.33, E5=659.26, F5=698.46, G5=783.99, A5=880.00, B5=987.77;
        const C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.00, A4=440.00, B4=493.88;
        const C3=130.81, D3=146.83, E3=164.81, F3=174.61, G3=196.00, A3=220.00, B3=246.94;
        const Bb3=233.08, Eb4=311.13, Ab3=207.65;
        const Bb4=466.16, Eb5=622.25;

        // =====================================================
        // LEVEL 1: The Backyard - Bouncy, cheerful, playful
        // C major, ~100 BPM, 28 bars (~67s), light shuffle drums
        // Structure: A(8) + B(8 no melody, arps) + C(8 new melody) + tag(4)
        // =====================================================
        {
            const bpm = 100;
            const beatDur = 60 / bpm;
            const barDur = beatDur * 4;
            const cycleDur = 8 * barDur;
            const parts = [];

            const chords = [
                [C3, E3, G3], [A3, C4, E4], [F3, A3, C4], [G3, B3, D4],
                [C3, E3, G3], [E3, G3, B3], [F3, A3, C4], [G3, B3, D4],
            ];
            const bassNotes = [
                { freq: C3, offset: 0 }, { freq: C3, offset: beatDur * 2 }, { freq: E3, offset: beatDur * 3 },
                { freq: A3, offset: barDur }, { freq: A3, offset: barDur + beatDur * 2 }, { freq: G3, offset: barDur + beatDur * 3 },
                { freq: F3, offset: barDur * 2 }, { freq: F3, offset: barDur * 2 + beatDur * 2 }, { freq: A3, offset: barDur * 2 + beatDur * 3 },
                { freq: G3, offset: barDur * 3 }, { freq: G3, offset: barDur * 3 + beatDur * 2 }, { freq: B3, offset: barDur * 3 + beatDur * 3 },
                { freq: C3, offset: barDur * 4 }, { freq: E3, offset: barDur * 4 + beatDur * 2 },
                { freq: E3, offset: barDur * 5 }, { freq: G3, offset: barDur * 5 + beatDur * 2 },
                { freq: F3, offset: barDur * 6 }, { freq: A3, offset: barDur * 6 + beatDur * 2 },
                { freq: G3, offset: barDur * 7 }, { freq: G3, offset: barDur * 7 + beatDur * 2 }, { freq: B3, offset: barDur * 7 + beatDur * 3 },
            ];
            const drumFn = () => {
                const dp = [];
                for (let bar = 0; bar < 8; bar++) {
                    const off = bar * 4;
                    dp.push({ beat: off, type: 'kick' });
                    dp.push({ beat: off + 2, type: 'kick', vol: 0.7 });
                    dp.push({ beat: off + 1, type: 'snare', vol: 0.6 });
                    dp.push({ beat: off + 3, type: 'snare', vol: 0.6 });
                    for (let i = 0; i < 8; i++) dp.push({ beat: off + i * 0.5, type: 'hat', vol: i % 2 === 0 ? 0.6 : 0.3 });
                }
                return _buildDrums(dp, beatDur, 32, 0.2);
            };

            const base = _buildBase(chords, barDur, beatDur, 0.09, _pad, bassNotes, 0.12, drumFn);

            // Cycle 1: base + melody A
            parts.push(...base);
            const melA = [
                { freq: E5, offset: 0, dur: 0.3 }, { freq: G5, offset: beatDur, dur: 0.3 },
                { freq: A5, offset: beatDur * 1.5, dur: 0.2 }, { freq: G5, offset: beatDur * 2, dur: 0.5 },
                { freq: A4, offset: barDur, dur: 0.3 }, { freq: C5, offset: barDur + beatDur, dur: 0.3 },
                { freq: E5, offset: barDur + beatDur * 2, dur: 0.6 },
                { freq: F5, offset: barDur * 2, dur: 0.3 }, { freq: E5, offset: barDur * 2 + beatDur, dur: 0.3 },
                { freq: C5, offset: barDur * 2 + beatDur * 2, dur: 0.3 }, { freq: A4, offset: barDur * 2 + beatDur * 3, dur: 0.3 },
                { freq: G5, offset: barDur * 3, dur: 0.3 }, { freq: E5, offset: barDur * 3 + beatDur, dur: 0.3 },
                { freq: D5, offset: barDur * 3 + beatDur * 2, dur: 0.8 },
                { freq: C5, offset: barDur * 4, dur: 0.5 }, { freq: D5, offset: barDur * 4 + beatDur * 1.5, dur: 0.3 },
                { freq: E5, offset: barDur * 4 + beatDur * 2.5, dur: 0.5 },
                { freq: G5, offset: barDur * 5, dur: 0.2 }, { freq: E5, offset: barDur * 5 + beatDur * 0.5, dur: 0.2 },
                { freq: G5, offset: barDur * 5 + beatDur, dur: 0.2 }, { freq: B5, offset: barDur * 5 + beatDur * 2, dur: 0.6 },
                { freq: A5, offset: barDur * 6, dur: 0.3 }, { freq: F5, offset: barDur * 6 + beatDur, dur: 0.3 },
                { freq: C5, offset: barDur * 6 + beatDur * 2, dur: 0.6 },
                { freq: G5, offset: barDur * 7, dur: 0.3 }, { freq: F5, offset: barDur * 7 + beatDur, dur: 0.3 },
                { freq: E5, offset: barDur * 7 + beatDur * 2, dur: 0.3 }, { freq: D5, offset: barDur * 7 + beatDur * 3, dur: 0.5 },
            ];
            for (const n of melA) parts.push({ samples: _pluck(n.freq, n.dur, 0.1), offset: n.offset });

            // Cycle 2: base + arpeggios only (no melody - breathing room)
            parts.push(..._offsetParts(base, cycleDur));
            for (let bar = 0; bar < 8; bar++) {
                const ch = chords[bar];
                const af = [ch[0] * 4, ch[1] * 2, ch[2] * 2];
                parts.push(..._buildArp(af, cycleDur + bar * barDur, barDur, beatDur * 0.5, 0.05));
            }

            // Cycle 3: base + melody B (variation - lead voice, different rhythm)
            parts.push(..._offsetParts(base, cycleDur * 2));
            const melB = [
                { freq: C5, offset: 0, dur: 0.4 }, { freq: E5, offset: beatDur, dur: 0.3 },
                { freq: G5, offset: beatDur * 2, dur: 0.5 }, { freq: E5, offset: barDur, dur: 0.6 },
                { freq: D5, offset: barDur + beatDur * 2, dur: 0.3 }, { freq: C5, offset: barDur + beatDur * 3, dur: 0.3 },
                { freq: A4, offset: barDur * 2, dur: 0.3 }, { freq: C5, offset: barDur * 2 + beatDur, dur: 0.4 },
                { freq: F5, offset: barDur * 2 + beatDur * 2.5, dur: 0.5 },
                { freq: E5, offset: barDur * 3, dur: 0.4 }, { freq: D5, offset: barDur * 3 + beatDur * 1.5, dur: 0.3 },
                { freq: G4, offset: barDur * 3 + beatDur * 3, dur: 0.5 },
                { freq: C5, offset: barDur * 4, dur: 0.3 }, { freq: G5, offset: barDur * 4 + beatDur * 1.5, dur: 0.5 },
                { freq: A5, offset: barDur * 5, dur: 0.3 }, { freq: G5, offset: barDur * 5 + beatDur, dur: 0.3 },
                { freq: E5, offset: barDur * 5 + beatDur * 2.5, dur: 0.5 },
                { freq: F5, offset: barDur * 6, dur: 0.4 }, { freq: D5, offset: barDur * 6 + beatDur * 1.5, dur: 0.4 },
                { freq: E5, offset: barDur * 6 + beatDur * 3, dur: 0.4 },
                { freq: D5, offset: barDur * 7, dur: 0.3 }, { freq: C5, offset: barDur * 7 + beatDur * 1.5, dur: 0.6 },
            ];
            for (const n of melB) parts.push({ samples: _lead(n.freq, n.dur, 0.09), offset: cycleDur * 2 + n.offset });
            // Add arps on last 4 bars of cycle 3
            for (let bar = 4; bar < 8; bar++) {
                const ch = chords[bar];
                parts.push(..._buildArp([ch[0] * 4, ch[1] * 2, ch[2] * 2], cycleDur * 2 + bar * barDur, barDur, beatDur * 0.5, 0.04));
            }

            // Tag: 4-bar outro (just first 4 chords, softer)
            const tagChords = chords.slice(0, 4);
            const tagOff = cycleDur * 3;
            for (let c = 0; c < tagChords.length; c++) {
                for (const freq of tagChords[c]) {
                    parts.push({ samples: _pad(freq, barDur + 0.1, 0.07), offset: tagOff + c * barDur });
                }
            }
            for (const n of bassNotes.slice(0, 12)) parts.push({ samples: _bass(n.freq, beatDur * 0.9, 0.1), offset: tagOff + n.offset });
            // Light drums on tag
            const tagDp = [];
            for (let bar = 0; bar < 4; bar++) {
                const off = bar * 4;
                tagDp.push({ beat: off, type: 'kick' });
                tagDp.push({ beat: off + 2, type: 'kick', vol: 0.5 });
                for (let i = 0; i < 8; i++) tagDp.push({ beat: off + i * 0.5, type: 'hat', vol: 0.3 });
            }
            parts.push(..._offsetParts(_buildDrums(tagDp, beatDur, 16, 0.15), tagOff));

            urls.music0 = _toWavUrl(_mix(parts)); // 28 bars = ~67s
        }

        // =====================================================
        // LEVEL 2: The Park - Groovy, dark, atmospheric
        // D minor, ~110 BPM, 28 bars (~61s)
        // Structure: A(8 melody) + B(8 arps) + C(8 new melody) + tag(4)
        // =====================================================
        {
            const bpm = 110;
            const beatDur = 60 / bpm;
            const barDur = beatDur * 4;
            const cycleDur = 8 * barDur;
            const parts = [];

            const chords = [
                [D3, F3, A3], [Bb3, D4, F4], [C3, E3, G3], [A3, C4, E4],
                [D3, F3, A3], [G3, Bb3, D4], [A3, C4 * 1.059, E4], [D3, F3, A3],
            ];
            const bassNotes = [
                { freq: D3, offset: 0, dur: beatDur * 1.5 },
                { freq: D3, offset: beatDur * 2, dur: beatDur * 0.8 },
                { freq: F3, offset: beatDur * 3, slide: A3 },
                { freq: Bb3, offset: barDur, dur: beatDur * 1.5 },
                { freq: Bb3, offset: barDur + beatDur * 2.5, dur: beatDur * 0.8 },
                { freq: C3, offset: barDur * 2, dur: beatDur * 1.5 },
                { freq: E3, offset: barDur * 2 + beatDur * 2, dur: beatDur },
                { freq: G3, offset: barDur * 2 + beatDur * 3, dur: beatDur * 0.8 },
                { freq: A3, offset: barDur * 3, dur: beatDur * 2 },
                { freq: A3, offset: barDur * 3 + beatDur * 2.5, dur: beatDur },
                { freq: D3, offset: barDur * 4, dur: beatDur * 1.5 },
                { freq: F3, offset: barDur * 4 + beatDur * 2, dur: beatDur },
                { freq: G3, offset: barDur * 5, dur: beatDur },
                { freq: Bb3, offset: barDur * 5 + beatDur, dur: beatDur },
                { freq: D3, offset: barDur * 5 + beatDur * 2.5, dur: beatDur },
                { freq: A3, offset: barDur * 6, dur: beatDur * 2 },
                { freq: A3, offset: barDur * 6 + beatDur * 2.5, dur: beatDur },
                { freq: D3, offset: barDur * 7, dur: beatDur * 2 },
                { freq: A3, offset: barDur * 7 + beatDur * 2.5, slide: D3 },
            ];
            const drumFn = () => {
                const dp = [];
                for (let bar = 0; bar < 8; bar++) {
                    const off = bar * 4;
                    dp.push({ beat: off, type: 'kick' }); dp.push({ beat: off + 1.5, type: 'kick', vol: 0.7 });
                    dp.push({ beat: off + 2, type: 'kick', vol: 0.85 });
                    dp.push({ beat: off + 1, type: 'snare' }); dp.push({ beat: off + 3, type: 'snare' });
                    for (let i = 0; i < 8; i++) {
                        if (i === 3 || i === 7) dp.push({ beat: off + i * 0.5, type: 'openhat', vol: 0.6 });
                        else dp.push({ beat: off + i * 0.5, type: 'hat', vol: i % 2 === 0 ? 0.7 : 0.4 });
                    }
                }
                return _buildDrums(dp, beatDur, 32, 0.22);
            };

            const base = _buildBase(chords, barDur, beatDur, 0.08, _sawPad, bassNotes, 0.13, drumFn);

            // Cycle 1: base + lead melody A
            parts.push(...base);
            const melA = [
                { freq: D5, offset: beatDur * 0.5, dur: 0.4 }, { freq: F5, offset: beatDur * 1.5, dur: 0.3 },
                { freq: A5, offset: beatDur * 2.5, dur: 0.6 },
                { freq: Bb4, offset: barDur + beatDur * 0.5, dur: 0.5 }, { freq: A4, offset: barDur + beatDur * 2, dur: 0.3 },
                { freq: G4, offset: barDur + beatDur * 3, dur: 0.4 },
                { freq: E5, offset: barDur * 2, dur: 0.3 }, { freq: G5, offset: barDur * 2 + beatDur * 1.5, dur: 0.5 },
                { freq: E5, offset: barDur * 2 + beatDur * 3, dur: 0.3 },
                { freq: A4, offset: barDur * 3, dur: 0.6 }, { freq: C5, offset: barDur * 3 + beatDur * 2, dur: 0.8 },
                { freq: D5, offset: barDur * 4, dur: 0.25 }, { freq: E5, offset: barDur * 4 + beatDur * 0.5, dur: 0.25 },
                { freq: F5, offset: barDur * 4 + beatDur, dur: 0.25 }, { freq: A5, offset: barDur * 4 + beatDur * 2, dur: 0.8 },
                { freq: G5, offset: barDur * 5 + beatDur * 0.5, dur: 0.4 }, { freq: F5, offset: barDur * 5 + beatDur * 2, dur: 0.4 },
                { freq: D5, offset: barDur * 5 + beatDur * 3, dur: 0.4 },
                { freq: E5, offset: barDur * 6, dur: 0.3 }, { freq: A5, offset: barDur * 6 + beatDur, dur: 0.5 },
                { freq: G5, offset: barDur * 6 + beatDur * 2.5, dur: 0.5 },
                { freq: F5, offset: barDur * 7, dur: 0.4 }, { freq: E5, offset: barDur * 7 + beatDur * 1.5, dur: 0.3 },
                { freq: D5, offset: barDur * 7 + beatDur * 2.5, dur: 0.8 },
            ];
            for (const n of melA) parts.push({ samples: _lead(n.freq, n.dur, 0.09), offset: n.offset });

            // Cycle 2: base + arpeggios (atmospheric, no melody)
            parts.push(..._offsetParts(base, cycleDur));
            for (let bar = 0; bar < 8; bar++) {
                const ch = chords[bar];
                parts.push(..._buildArp([ch[0] * 4, ch[1] * 2, ch[2] * 2], cycleDur + bar * barDur, barDur, beatDur * 0.5, 0.045));
            }

            // Cycle 3: base + melody B (pluck voice, different phrasing)
            parts.push(..._offsetParts(base, cycleDur * 2));
            const melB = [
                { freq: A5, offset: 0, dur: 0.5 }, { freq: F5, offset: beatDur * 1.5, dur: 0.3 },
                { freq: D5, offset: beatDur * 2.5, dur: 0.5 },
                { freq: D5, offset: barDur, dur: 0.3 }, { freq: F5, offset: barDur + beatDur, dur: 0.3 },
                { freq: Bb4, offset: barDur + beatDur * 2.5, dur: 0.5 },
                { freq: C5, offset: barDur * 2, dur: 0.4 }, { freq: E5, offset: barDur * 2 + beatDur * 1.5, dur: 0.4 },
                { freq: G5, offset: barDur * 2 + beatDur * 3, dur: 0.3 },
                { freq: A4, offset: barDur * 3, dur: 0.5 }, { freq: E5, offset: barDur * 3 + beatDur * 2, dur: 0.6 },
                { freq: D5, offset: barDur * 4, dur: 0.3 }, { freq: A5, offset: barDur * 4 + beatDur, dur: 0.4 },
                { freq: F5, offset: barDur * 4 + beatDur * 2.5, dur: 0.5 },
                { freq: G5, offset: barDur * 5, dur: 0.4 }, { freq: Bb4, offset: barDur * 5 + beatDur * 1.5, dur: 0.4 },
                { freq: D5, offset: barDur * 5 + beatDur * 3, dur: 0.3 },
                { freq: E5, offset: barDur * 6, dur: 0.3 }, { freq: C5, offset: barDur * 6 + beatDur, dur: 0.4 },
                { freq: A5, offset: barDur * 6 + beatDur * 2.5, dur: 0.6 },
                { freq: D5, offset: barDur * 7, dur: 0.5 }, { freq: A4, offset: barDur * 7 + beatDur * 2, dur: 0.7 },
            ];
            for (const n of melB) parts.push({ samples: _pluck(n.freq, n.dur, 0.1), offset: cycleDur * 2 + n.offset });

            // Tag: 4 bars wind-down
            const tagOff = cycleDur * 3;
            for (let c = 0; c < 4; c++) {
                for (const freq of chords[c]) parts.push({ samples: _sawPad(freq, barDur + 0.1, 0.06), offset: tagOff + c * barDur });
            }
            for (const n of bassNotes.slice(0, 10)) parts.push({ samples: _bass(n.freq, n.dur || beatDur * 0.8, 0.1), offset: tagOff + n.offset });
            const tagDp = [];
            for (let bar = 0; bar < 4; bar++) {
                const off = bar * 4;
                tagDp.push({ beat: off, type: 'kick' }); tagDp.push({ beat: off + 2, type: 'kick', vol: 0.5 });
                for (let i = 0; i < 8; i++) tagDp.push({ beat: off + i * 0.5, type: 'hat', vol: 0.3 });
            }
            parts.push(..._offsetParts(_buildDrums(tagDp, beatDur, 16, 0.15), tagOff));

            urls.music1 = _toWavUrl(_mix(parts)); // 28 bars = ~61s
        }

        // =====================================================
        // LEVEL 3: Cat Central - Intense, driving, dramatic
        // A minor, ~130 BPM, 34 bars (~63s)
        // Structure: A(8 melody+arps) + B(8 arps only) + C(8 melody var) + D(8 melody+arps) + tag(2)
        // =====================================================
        {
            const bpm = 130;
            const beatDur = 60 / bpm;
            const barDur = beatDur * 4;
            const cycleDur = 8 * barDur;
            const parts = [];

            const chords = [
                [A3, C4, E4], [F3, A3, C4], [D3, F3, A3], [E3, G3 * 1.059, B3],
                [A3, C4, E4], [G3, B3, D4], [F3, A3, C4], [E3, G3 * 1.059, B3],
            ];
            const bassRoots = [A3, F3, D3, E3, A3, G3, F3, E3];

            // Generate one cycle of base (pads + bass + drums)
            const buildCycle3Base = () => {
                const bp = [];
                for (let c = 0; c < chords.length; c++) {
                    for (const freq of chords[c]) bp.push({ samples: _sawPad(freq, barDur + 0.1, 0.1), offset: c * barDur });
                }
                for (let bar = 0; bar < 8; bar++) {
                    const root = bassRoots[bar];
                    for (let i = 0; i < 8; i++) {
                        const freq = (i % 4 === 2) ? root * 1.5 : root;
                        bp.push({ samples: _bass(freq, beatDur * 0.45, (i % 2 === 0) ? 0.14 : 0.09), offset: bar * barDur + i * beatDur * 0.5 });
                    }
                }
                // Drums
                const dp = [];
                for (let bar = 0; bar < 8; bar++) {
                    const off = bar * 4;
                    const isFill = (bar === 3 || bar === 7);
                    if (isFill) {
                        dp.push({ beat: off, type: 'kick' }); dp.push({ beat: off + 0.5, type: 'snare', vol: 0.5 });
                        dp.push({ beat: off + 1, type: 'kick' }); dp.push({ beat: off + 1.5, type: 'snare', vol: 0.6 });
                        dp.push({ beat: off + 2, type: 'snare', vol: 0.7 }); dp.push({ beat: off + 2.5, type: 'snare', vol: 0.8 });
                        dp.push({ beat: off + 3, type: 'snare', vol: 0.9 }); dp.push({ beat: off + 3.5, type: 'kick' });
                        for (let i = 0; i < 8; i++) dp.push({ beat: off + i * 0.5, type: 'hat', vol: 0.5 });
                    } else {
                        for (let b = 0; b < 4; b++) dp.push({ beat: off + b, type: 'kick' });
                        dp.push({ beat: off + 1, type: 'snare' }); dp.push({ beat: off + 3, type: 'snare' });
                        for (let i = 0; i < 16; i++) {
                            const vol = (i % 4 === 0) ? 0.7 : (i % 2 === 0) ? 0.5 : 0.25;
                            dp.push({ beat: off + i * 0.25, type: 'hat', vol });
                        }
                        dp.push({ beat: off + 1.75, type: 'openhat', vol: 0.5 });
                        dp.push({ beat: off + 3.75, type: 'openhat', vol: 0.5 });
                    }
                }
                bp.push(..._buildDrums(dp, beatDur, 32, 0.25));
                return bp;
            };

            const base = buildCycle3Base();

            const addArps = (off) => {
                for (let bar = 0; bar < 8; bar++) {
                    const ch = chords[bar];
                    parts.push(..._buildArp([ch[0] * 4, ch[1] * 2, ch[2] * 2, ch[1] * 2], off + bar * barDur, barDur, beatDur * 0.25, 0.035));
                }
            };

            // Cycle 1: base + melody A + arps
            parts.push(...base);
            const melA = [
                { freq: A5, offset: 0, dur: 0.2 }, { freq: G5, offset: beatDur * 0.5, dur: 0.15 },
                { freq: A5, offset: beatDur, dur: 0.15 }, { freq: C5 * 2, offset: beatDur * 1.5, dur: 0.3 },
                { freq: A5, offset: beatDur * 2.5, dur: 0.4 },
                { freq: F5, offset: barDur, dur: 0.2 }, { freq: A5, offset: barDur + beatDur, dur: 0.2 },
                { freq: C5 * 2, offset: barDur + beatDur * 2, dur: 0.3 }, { freq: A5, offset: barDur + beatDur * 3, dur: 0.3 },
                { freq: D5 * 2, offset: barDur * 2, dur: 0.15 }, { freq: C5 * 2, offset: barDur * 2 + beatDur * 0.5, dur: 0.15 },
                { freq: A5, offset: barDur * 2 + beatDur, dur: 0.15 }, { freq: F5, offset: barDur * 2 + beatDur * 1.5, dur: 0.15 },
                { freq: D5, offset: barDur * 2 + beatDur * 2, dur: 0.5 },
                { freq: E5, offset: barDur * 3, dur: 0.3 }, { freq: G5 * 1.059, offset: barDur * 3 + beatDur * 1.5, dur: 0.5 },
                { freq: B5, offset: barDur * 3 + beatDur * 3, dur: 0.3 },
                { freq: A5, offset: barDur * 4, dur: 0.15 }, { freq: E5, offset: barDur * 4 + beatDur * 0.5, dur: 0.15 },
                { freq: A5, offset: barDur * 4 + beatDur, dur: 0.15 }, { freq: E5, offset: barDur * 4 + beatDur * 1.5, dur: 0.15 },
                { freq: A5, offset: barDur * 4 + beatDur * 2, dur: 0.5 },
                { freq: G5, offset: barDur * 5, dur: 0.2 }, { freq: B5, offset: barDur * 5 + beatDur, dur: 0.3 },
                { freq: D5 * 2, offset: barDur * 5 + beatDur * 2, dur: 0.4 },
                { freq: F5, offset: barDur * 6, dur: 0.15 }, { freq: A5, offset: barDur * 6 + beatDur * 0.5, dur: 0.15 },
                { freq: C5 * 2, offset: barDur * 6 + beatDur, dur: 0.15 }, { freq: A5, offset: barDur * 6 + beatDur * 1.5, dur: 0.15 },
                { freq: F5, offset: barDur * 6 + beatDur * 2, dur: 0.15 }, { freq: A5, offset: barDur * 6 + beatDur * 2.5, dur: 0.15 },
                { freq: C5 * 2, offset: barDur * 6 + beatDur * 3, dur: 0.3 },
                { freq: E5, offset: barDur * 7, dur: 0.2 }, { freq: G5 * 1.059, offset: barDur * 7 + beatDur, dur: 0.3 },
                { freq: B5, offset: barDur * 7 + beatDur * 2, dur: 0.5 }, { freq: A5, offset: barDur * 7 + beatDur * 3, dur: 0.4 },
            ];
            for (const n of melA) parts.push({ samples: _lead(n.freq, n.dur, 0.1), offset: n.offset });
            addArps(0);

            // Cycle 2: base + arps only (intense instrumental)
            parts.push(..._offsetParts(base, cycleDur));
            addArps(cycleDur);

            // Cycle 3: base + melody B (variation - pluck voice, different rhythm)
            parts.push(..._offsetParts(base, cycleDur * 2));
            const melB = [
                { freq: E5, offset: 0, dur: 0.2 }, { freq: A5, offset: beatDur * 0.5, dur: 0.3 },
                { freq: C5 * 2, offset: beatDur * 1.5, dur: 0.4 },
                { freq: A5, offset: barDur, dur: 0.3 }, { freq: F5, offset: barDur + beatDur, dur: 0.25 },
                { freq: C5, offset: barDur + beatDur * 2, dur: 0.25 }, { freq: F5, offset: barDur + beatDur * 3, dur: 0.3 },
                { freq: D5, offset: barDur * 2, dur: 0.2 }, { freq: F5, offset: barDur * 2 + beatDur * 0.5, dur: 0.2 },
                { freq: A5, offset: barDur * 2 + beatDur, dur: 0.2 }, { freq: D5 * 2, offset: barDur * 2 + beatDur * 2, dur: 0.5 },
                { freq: B5, offset: barDur * 3, dur: 0.3 }, { freq: G5 * 1.059, offset: barDur * 3 + beatDur, dur: 0.4 },
                { freq: E5, offset: barDur * 3 + beatDur * 2.5, dur: 0.5 },
                { freq: A5, offset: barDur * 4, dur: 0.2 }, { freq: C5 * 2, offset: barDur * 4 + beatDur, dur: 0.2 },
                { freq: A5, offset: barDur * 4 + beatDur * 2, dur: 0.2 }, { freq: E5, offset: barDur * 4 + beatDur * 3, dur: 0.3 },
                { freq: G5, offset: barDur * 5, dur: 0.3 }, { freq: D5, offset: barDur * 5 + beatDur, dur: 0.3 },
                { freq: B5, offset: barDur * 5 + beatDur * 2, dur: 0.5 },
                { freq: C5 * 2, offset: barDur * 6, dur: 0.15 }, { freq: A5, offset: barDur * 6 + beatDur * 0.5, dur: 0.15 },
                { freq: F5, offset: barDur * 6 + beatDur, dur: 0.15 }, { freq: A5, offset: barDur * 6 + beatDur * 1.5, dur: 0.15 },
                { freq: C5 * 2, offset: barDur * 6 + beatDur * 2.5, dur: 0.4 },
                { freq: B5, offset: barDur * 7, dur: 0.3 }, { freq: G5 * 1.059, offset: barDur * 7 + beatDur, dur: 0.3 },
                { freq: E5, offset: barDur * 7 + beatDur * 2, dur: 0.3 }, { freq: A5, offset: barDur * 7 + beatDur * 3, dur: 0.4 },
            ];
            for (const n of melB) parts.push({ samples: _pluck(n.freq, n.dur, 0.1), offset: cycleDur * 2 + n.offset });
            addArps(cycleDur * 2);

            // Cycle 4: base + melody A reprise + arps
            parts.push(..._offsetParts(base, cycleDur * 3));
            for (const n of melA) parts.push({ samples: _lead(n.freq, n.dur, 0.1), offset: cycleDur * 3 + n.offset });
            addArps(cycleDur * 3);

            // Tag: 2-bar crash ending
            const tagOff = cycleDur * 4;
            for (const freq of chords[0]) parts.push({ samples: _sawPad(freq, barDur * 2 + 0.1, 0.12), offset: tagOff });
            parts.push({ samples: _bass(A3, barDur, 0.15), offset: tagOff });
            parts.push(..._offsetParts(_buildDrums([
                { beat: 0, type: 'kick' }, { beat: 1, type: 'kick' }, { beat: 2, type: 'kick' }, { beat: 3, type: 'kick' },
                { beat: 4, type: 'kick' }, { beat: 5, type: 'snare' }, { beat: 6, type: 'snare' }, { beat: 7, type: 'snare' },
            ], beatDur, 8, 0.25), tagOff));

            urls.music2 = _toWavUrl(_mix(parts)); // 34 bars = ~63s
        }
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
        shoot:        () => _play('shoot'),
        enemyDeath:   () => _play('pop'),
        enemyEscape:  noop,
        waveStart:    noop,
        placeTower:   () => _play('place'),
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
