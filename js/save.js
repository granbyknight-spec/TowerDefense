// Save/Load system using shareable save codes
// Encodes game state to a compact base64 string that players can copy/paste

const SaveSystem = {
    SAVE_VERSION: 1,
    LOCAL_KEY: 'puppy_academy_save',

    // === ENCODE / DECODE ===

    // Compress JSON to base64 save code
    encode(data) {
        const json = JSON.stringify(data);
        // Simple UTF-16 to base64 encoding
        const bytes = new TextEncoder().encode(json);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return 'PAv1_' + btoa(binary);
    },

    // Decode base64 save code back to JSON
    decode(code) {
        try {
            if (!code || !code.startsWith('PAv1_')) return null;
            const b64 = code.slice(5);
            const binary = atob(b64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            const json = new TextDecoder().decode(bytes);
            return JSON.parse(json);
        } catch (e) {
            console.error('Save decode error:', e);
            return null;
        }
    },

    // === SAVE STATE ===

    // Build the full save state from the academy
    buildSaveState(academy) {
        return {
            v: this.SAVE_VERSION,
            ts: Date.now(),
            name: academy.playerName,
            rank: academy.trainerRank,
            xp: academy.trainerXP,
            bones: academy.bones,
            treats: academy.treats,
            roster: academy.roster.map(dog => ({
                id: dog.id,
                breed: dog.breed,
                name: dog.name,
                level: dog.level,
                xp: dog.xp,
                bond: dog.bond,
                battlesWon: dog.battlesWon,
            })),
            activeDogId: academy.activeDogId,
            completedLevels: academy.completedLevels,
            totalBattles: academy.totalBattles,
            factsLearned: academy.factsLearned,
            triviaCorrect: academy.triviaCorrect,
        };
    },

    // Save to localStorage
    saveLocal(academy) {
        try {
            const state = this.buildSaveState(academy);
            localStorage.setItem(this.LOCAL_KEY, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('Local save error:', e);
            return false;
        }
    },

    // Load from localStorage
    loadLocal() {
        try {
            const raw = localStorage.getItem(this.LOCAL_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    },

    // Generate a shareable save code
    generateCode(academy) {
        const state = this.buildSaveState(academy);
        return this.encode(state);
    },

    // Load from a shareable save code
    loadCode(code) {
        return this.decode(code.trim());
    },

    // Delete local save
    clearLocal() {
        localStorage.removeItem(this.LOCAL_KEY);
    }
};
