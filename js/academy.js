// Puppy Academy - Hub/Overworld system
// This is the core game. Tower Defense is a mini-game launched from here.

// Dog breed database with real facts
const DOG_BREEDS = {
    barker: {
        breed: 'Beagle',
        emoji: '🐕',
        funFact: 'Beagles have about 220 million scent receptors. Humans only have 5 million!',
        origin: 'England',
        trait: 'Curious & friendly',
        group: 'Hound',
        towerType: 'barker',
    },
    poodle: {
        breed: 'Poodle',
        emoji: '🐩',
        funFact: 'Poodles are the 2nd smartest dog breed. Their fancy haircuts were originally to help them swim!',
        origin: 'Germany/France',
        trait: 'Intelligent & proud',
        group: 'Non-Sporting',
        towerType: 'poodle',
    },
    husky: {
        breed: 'Siberian Husky',
        emoji: '🐺',
        funFact: 'Huskies can run 100+ miles a day in freezing temps. Their double coat keeps them warm at -60°F!',
        origin: 'Siberia, Russia',
        trait: 'Energetic & loyal',
        group: 'Working',
        towerType: 'husky',
    },
    bigboi: {
        breed: 'Mastiff',
        emoji: '🐶',
        funFact: 'English Mastiffs can weigh over 230 pounds - the heaviest dog breed in the world!',
        origin: 'England',
        trait: 'Gentle giant',
        group: 'Working',
        towerType: 'bigboi',
    },
    sparky: {
        breed: 'Border Collie',
        emoji: '⚡',
        funFact: 'Border Collies are the smartest dog breed. One named Chaser learned 1,022 words!',
        origin: 'Scottish Borders',
        trait: 'Brilliant & athletic',
        group: 'Herding',
        towerType: 'sparky',
    },
    goldie: {
        breed: 'Golden Retriever',
        emoji: '🦮',
        funFact: 'Golden Retrievers have such gentle mouths they can carry a raw egg without breaking it!',
        origin: 'Scotland',
        trait: 'Friendly & devoted',
        group: 'Sporting',
        towerType: null, // future tower type
    },
    dalmatian: {
        breed: 'Dalmatian',
        emoji: '🏅',
        funFact: 'Dalmatian puppies are born completely white! Their spots develop after 2-3 weeks.',
        origin: 'Croatia',
        trait: 'Playful & dignified',
        group: 'Non-Sporting',
        towerType: null,
    },
    shiba: {
        breed: 'Shiba Inu',
        emoji: '🐕‍🦺',
        funFact: 'Shiba Inus are the most popular breed in Japan and are famous for the "Shiba scream"!',
        origin: 'Japan',
        trait: 'Alert & bold',
        group: 'Non-Sporting',
        towerType: null,
    },
};

// Trainer rank titles
const TRAINER_RANKS = [
    { rank: 0, title: 'Puppy Walker',       xpNeeded: 0 },
    { rank: 1, title: 'Dog Sitter',         xpNeeded: 100 },
    { rank: 2, title: 'Junior Trainer',      xpNeeded: 300 },
    { rank: 3, title: 'Dog Trainer',         xpNeeded: 600 },
    { rank: 4, title: 'Senior Trainer',      xpNeeded: 1000 },
    { rank: 5, title: 'Kennel Master',       xpNeeded: 1500 },
    { rank: 6, title: 'Pack Leader',         xpNeeded: 2500 },
    { rank: 7, title: 'Best in Show',        xpNeeded: 4000 },
];

// Dogs available at the shelter to recruit
const SHELTER_DOGS = [
    { breed: 'poodle',    cost: 150,  minRank: 0 },
    { breed: 'husky',     cost: 250,  minRank: 1 },
    { breed: 'sparky',    cost: 300,  minRank: 2 },
    { breed: 'bigboi',    cost: 400,  minRank: 3 },
    { breed: 'goldie',    cost: 350,  minRank: 2 },
    { breed: 'dalmatian', cost: 500,  minRank: 4 },
    { breed: 'shiba',     cost: 450,  minRank: 3 },
];

let _nextDogId = 1;

class Academy {
    constructor() {
        this.playerName = '';
        this.trainerRank = 0;
        this.trainerXP = 0;
        this.bones = 200;  // currency earned from battles
        this.treats = 50;  // premium currency for bonding

        // Dog roster
        this.roster = [];
        this.activeDogId = null; // your companion in battles

        // Progress tracking
        this.completedLevels = []; // level indices completed
        this.totalBattles = 0;
        this.factsLearned = [];    // breed IDs whose facts player has seen
        this.triviaCorrect = 0;

        // UI state
        this.currentScreen = 'title'; // title, hub, kennel, shelter, battles, profile, save
        this.selectedDog = null;
        this.notification = null;
        this._notifTimer = 0;
    }

    // Create a new dog for the roster
    createDog(breedKey, customName) {
        const breedData = DOG_BREEDS[breedKey];
        if (!breedData) return null;

        const dog = {
            id: _nextDogId++,
            breed: breedKey,
            name: customName || breedData.breed,
            level: 1,
            xp: 0,
            bond: 0,      // 0-100, increases with treats & play
            battlesWon: 0,
            factSeen: false,
        };
        this.roster.push(dog);

        if (!this.activeDogId) {
            this.activeDogId = dog.id;
        }

        return dog;
    }

    // Get the active companion dog
    getActiveDog() {
        return this.roster.find(d => d.id === this.activeDogId) || null;
    }

    // Get breed data for a dog
    getBreedData(dog) {
        return DOG_BREEDS[dog.breed] || null;
    }

    // Get current trainer title
    getTrainerTitle() {
        let title = TRAINER_RANKS[0].title;
        for (const r of TRAINER_RANKS) {
            if (this.trainerXP >= r.xpNeeded) {
                this.trainerRank = r.rank;
                title = r.title;
            }
        }
        return title;
    }

    // XP needed for next rank
    getNextRankXP() {
        for (const r of TRAINER_RANKS) {
            if (this.trainerXP < r.xpNeeded) return r.xpNeeded;
        }
        return TRAINER_RANKS[TRAINER_RANKS.length - 1].xpNeeded;
    }

    // Add XP and check for rank up
    addXP(amount) {
        const oldRank = this.trainerRank;
        this.trainerXP += amount;
        this.getTrainerTitle(); // recalculate rank
        if (this.trainerRank > oldRank) {
            this.showNotification('Rank Up! ' + this.getTrainerTitle());
            return true; // ranked up
        }
        return false;
    }

    // Reward from completing a battle
    awardBattleRewards(levelIndex, kills, livesLeft, won) {
        this.totalBattles++;
        const boneReward = kills * 2 + (won ? 100 : 20) + livesLeft * 5;
        const xpReward = kills + (won ? 50 : 10);
        const treatReward = won ? 10 : 2;

        this.bones += boneReward;
        this.treats += treatReward;
        this.addXP(xpReward);

        // Level dog companion
        const dog = this.getActiveDog();
        if (dog) {
            dog.xp += xpReward;
            if (won) dog.battlesWon++;
            // Level up every 100 xp
            const newLevel = Math.floor(dog.xp / 100) + 1;
            if (newLevel > dog.level) {
                dog.level = newLevel;
                this.showNotification(dog.name + ' leveled up to Lv' + dog.level + '!');
            }
        }

        if (won && !this.completedLevels.includes(levelIndex)) {
            this.completedLevels.push(levelIndex);
        }

        SaveSystem.saveLocal(this);

        return { bones: boneReward, treats: treatReward, xp: xpReward };
    }

    // Give a treat to a dog (bonding)
    giveTreat(dogId) {
        if (this.treats <= 0) return false;
        const dog = this.roster.find(d => d.id === dogId);
        if (!dog) return false;

        this.treats--;
        dog.bond = Math.min(100, dog.bond + 5);
        SaveSystem.saveLocal(this);
        return true;
    }

    // Adopt a dog from shelter
    adoptDog(shelterIdx, customName) {
        const offer = SHELTER_DOGS[shelterIdx];
        if (!offer) return null;
        if (this.bones < offer.cost) return null;
        if (this.trainerRank < offer.minRank) return null;

        // Check if already have 2 of this breed
        const count = this.roster.filter(d => d.breed === offer.breed).length;
        if (count >= 2) return null;

        this.bones -= offer.cost;
        const dog = this.createDog(offer.breed, customName);

        // Mark fact as learned
        if (!this.factsLearned.includes(offer.breed)) {
            this.factsLearned.push(offer.breed);
        }

        SaveSystem.saveLocal(this);
        return dog;
    }

    // Show a notification banner
    showNotification(msg) {
        this.notification = msg;
        this._notifTimer = 3;
    }

    // Load state from a save object
    loadFromState(state) {
        if (!state || state.v !== SaveSystem.SAVE_VERSION) return false;

        this.playerName = state.name || 'Anonymous';
        this.trainerRank = state.rank || 0;
        this.trainerXP = state.xp || 0;
        this.bones = state.bones || 0;
        this.treats = state.treats || 0;
        this.completedLevels = state.completedLevels || [];
        this.totalBattles = state.totalBattles || 0;
        this.factsLearned = state.factsLearned || [];
        this.triviaCorrect = state.triviaCorrect || 0;
        this.activeDogId = state.activeDogId || null;

        this.roster = [];
        if (state.roster) {
            for (const d of state.roster) {
                const dog = {
                    id: d.id,
                    breed: d.breed,
                    name: d.name,
                    level: d.level || 1,
                    xp: d.xp || 0,
                    bond: d.bond || 0,
                    battlesWon: d.battlesWon || 0,
                    factSeen: false,
                };
                this.roster.push(dog);
                if (d.id >= _nextDogId) _nextDogId = d.id + 1;
            }
        }

        return true;
    }

    // Initialize fresh game - pick starter dog
    newGame(playerName, starterBreed) {
        this.playerName = playerName || 'Anonymous';
        this.trainerRank = 0;
        this.trainerXP = 0;
        this.bones = 200;
        this.treats = 50;
        this.roster = [];
        this.completedLevels = [];
        this.totalBattles = 0;
        this.factsLearned = [starterBreed];
        this.triviaCorrect = 0;
        this.activeDogId = null;

        const dog = this.createDog(starterBreed);
        this.activeDogId = dog.id;

        SaveSystem.saveLocal(this);
        return dog;
    }
}
