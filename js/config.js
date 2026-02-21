// Game configuration and balance values
const CONFIG = {
    // Grid
    GRID_COLS: 12,
    GRID_ROWS: 18,

    // Entry/exit (grid coordinates)
    ENTRY: { col: 0, row: 9 },
    EXIT: { col: 11, row: 9 },

    // Starting resources
    START_GOLD: 200,
    START_LIVES: 20,
    WAVE_INCOME: 25,
    SEND_EARLY_BONUS: 30,
    SELL_REFUND: 0.5,

    // Upgrade system — 3 upgrade tiers (level 1 → 2 → 3 → 4)
    MAX_TOWER_LEVEL: 4,
    UPGRADE_COST_MULT: 1.0,
    UPGRADE_STAT_MULT: 1.4,

    // Levels (stages)
    LEVELS: [
        { name: 'The Backyard', waves: 7, hpScale: 1.0, speedScale: 1.0 },
        { name: 'The Park', waves: 10, hpScale: 1.6, speedScale: 1.1 },
        { name: 'Cat Central', waves: 13, hpScale: 2.4, speedScale: 1.2 }
    ],

    // Tower definitions
    // DPS = damage / fireRate
    TOWERS: {
        barker: {
            name: 'Barker',
            emoji: '🐕',
            cost: 50,
            range: 3,
            damage: 8,
            fireRate: 0.8, // 10 DPS
            color: '#D2691E',
            projectileColor: '#F5DEB3',
            projectileSpeed: 6,
            splash: 0,
            slow: 0,
            description: 'Fast single-target'
        },
        poodle: {
            name: 'Poodle',
            emoji: '🐩',
            cost: 60,
            range: 2.5,
            damage: 5,
            fireRate: 0.6, // 8.3 DPS + slow
            color: '#FFB6C1',
            projectileColor: '#DA70D6',
            projectileSpeed: 5,
            splash: 0,
            slow: 0.5,
            slowDuration: 2,
            description: 'Rapid fire + slow'
        },
        husky: {
            name: 'Husky',
            emoji: '🐺',
            cost: 90,
            range: 2.5,
            damage: 2,
            fireRate: 1.2, // 1.7 DPS (support)
            color: '#4FC3F7',
            projectileColor: '#B3E5FC',
            projectileSpeed: 5,
            splash: 1.2,
            slow: 0.35,
            slowDuration: 3,
            description: 'AoE freeze howl'
        },
        bigboi: {
            name: 'Big Boi',
            emoji: '🐶',
            cost: 100,
            range: 2,
            damage: 25,
            fireRate: 1.8, // 13.9 DPS + splash
            color: '#8B4513',
            projectileColor: '#FF6347',
            projectileSpeed: 4,
            splash: 1.5,
            slow: 0,
            description: 'Splash damage WOOF'
        }
    },

    // Enemy definitions
    ENEMIES: {
        kitten: {
            name: 'Kitten',
            emoji: '🐱',
            hp: 30,
            speed: 2.5,
            gold: 10,
            color: '#FFD700',
            armor: 0,
            size: 0.3
        },
        tabby: {
            name: 'Tabby',
            emoji: '🐈',
            hp: 80,
            speed: 1.8,
            gold: 20,
            color: '#FF8C00',
            armor: 0,
            size: 0.35
        },
        fatcat: {
            name: 'Fat Cat',
            emoji: '🐈‍⬛',
            hp: 200,
            speed: 1.0,
            gold: 50,
            color: '#4A4A4A',
            armor: 5,
            size: 0.45
        }
    },

    // Wave system
    WAVE_DELAY: 5,
    SPAWN_INTERVAL: 0.6,

    // Trivia
    TRIVIA_TIME: 3,     // seconds to answer
    TRIVIA_REWARD: 100,  // gold for correct answer
    TRIVIA: [
        { q: "What breed is the world's fastest dog?", a: ['Greyhound', 'Whippet', 'Saluki', 'Dalmatian'], c: 0 },
        { q: "How many teeth does an adult dog have?", a: ['42', '36', '28', '48'], c: 0 },
        { q: "What is a group of puppies called?", a: ['A litter', 'A pack', 'A herd', 'A pod'], c: 0 },
        { q: "Which breed is the smallest?", a: ['Chihuahua', 'Yorkie', 'Pomeranian', 'Papillon'], c: 0 },
        { q: "What breed was Lassie?", a: ['Rough Collie', 'Sheltie', 'Golden Retriever', 'Beagle'], c: 0 },
        { q: "How many eyelids does a dog have per eye?", a: ['Three', 'Two', 'One', 'Four'], c: 0 },
        { q: "Which sense is strongest in dogs?", a: ['Smell', 'Hearing', 'Sight', 'Taste'], c: 0 },
        { q: "What breed is known as the 'Wiener Dog'?", a: ['Dachshund', 'Corgi', 'Basset Hound', 'Beagle'], c: 0 },
        { q: "Dalmatian puppies are born what color?", a: ['White', 'Spotted', 'Black', 'Gray'], c: 0 },
        { q: "Which breed has a blue-black tongue?", a: ['Chow Chow', 'Akita', 'Shar Pei', 'Husky'], c: 0 },
        { q: "Which breed can't bark?", a: ['Basenji', 'Shiba Inu', 'Whippet', 'Borzoi'], c: 0 },
        { q: "Which breed is the tallest?", a: ['Great Dane', 'Irish Wolfhound', 'Mastiff', 'St. Bernard'], c: 0 },
        { q: "Which breed is the heaviest?", a: ['English Mastiff', 'Great Dane', 'St. Bernard', 'Newfoundland'], c: 0 },
        { q: "Dogs can see which colors best?", a: ['Blue & yellow', 'Red & green', 'All colors', 'Only gray'], c: 0 },
        { q: "Which breed was bred for Alpine rescue?", a: ['St. Bernard', 'Bernese Mountain', 'Husky', 'Malamute'], c: 0 },
        { q: "How many muscles control a dog's ear?", a: ['18', '6', '12', '24'], c: 0 },
        { q: "What breed is Scooby-Doo?", a: ['Great Dane', 'Bloodhound', 'Mastiff', 'Boxer'], c: 0 },
        { q: "Dogs sweat mainly through their...?", a: ['Paw pads', 'Tongue', 'Nose', 'Belly'], c: 0 },
        { q: "Which is the 'Firehouse Dog' breed?", a: ['Dalmatian', 'Lab', 'German Shepherd', 'Boxer'], c: 0 },
        { q: "A dog's nose print is unique like a...?", a: ['Fingerprint', 'Snowflake', 'DNA strand', 'Retina'], c: 0 },
        { q: "How many bones does a dog have?", a: ['~320', '~200', '~400', '~260'], c: 0 },
        { q: "Which breed is the most popular in the US?", a: ['Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'Bulldog'], c: 0 },
        { q: "What is a female dog called?", a: ['A dam', 'A queen', 'A hen', 'A mare'], c: 0 },
        { q: "Puppies are born deaf and...?", a: ['Blind', 'Hairless', 'Toothless', 'Tailless'], c: 0 },
        { q: "Which breed is known for herding sheep?", a: ['Border Collie', 'Poodle', 'Beagle', 'Boxer'], c: 0 },
    ],

    // Visual
    GRASS_COLOR: '#4A7C2E',
    GRASS_COLOR_ALT: '#3D6B25',
    PATH_COLOR: '#8B7355',
    GRID_LINE_COLOR: 'rgba(0,0,0,0.06)',
    RANGE_COLOR: 'rgba(255,255,255,0.08)',
    BLOCKED_COLOR: 'rgba(255,60,60,0.3)',
    VALID_COLOR: 'rgba(100,255,100,0.25)',
};
