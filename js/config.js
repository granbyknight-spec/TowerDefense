// Game version – shown on title screen to verify bundle freshness
const GAME_VERSION = 'v0.3.0';

// Game configuration and balance values
const CONFIG = {
    // Grid
    GRID_COLS: 12,
    GRID_ROWS: 18,

    // Entry/exit (grid coordinates)
    ENTRY: { col: 0, row: 9 },
    EXIT: { col: 11, row: 9 },

    // Starting resources
    START_GOLD: 600,
    START_LIVES: 20,
    WAVE_INCOME: 25,
    SEND_EARLY_BONUS: 30,
    SELL_REFUND: 0.5,

    // Combo kill system
    COMBO: {
        WINDOW: 1.5,       // seconds between kills to maintain combo
        THRESHOLDS: [
            { count: 3,  label: 'COMBO',         color: '#FFD700', bonus: 5 },
            { count: 5,  label: 'SUPER COMBO',   color: '#FF8C00', bonus: 15 },
            { count: 10, label: 'MEGA COMBO',    color: '#FF0055', bonus: 30 },
            { count: 15, label: 'ULTRA COMBO',   color: '#9C27B0', bonus: 50 },
            { count: 20, label: 'CAT-ASTROPHE!', color: '#00E5FF', bonus: 100 },
        ],
        SHAKE_MIN: 5,      // minimum combo for screen shake
        SHAKE_DURATION: 0.3,
    },

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

    // Map obstacle layouts per level
    // Cell types: 0=empty, 2=water, 3=rock, 4=tree, 5=bridge
    MAP_LAYOUTS: [
        // Level 1: The Backyard - open field
        null,
        // Level 2: The Park - river through middle
        {
            obstacles: [
                // River cols 5-6, bridges at rows 4, 9, 14
                { col: 5, row: 0, type: 2 }, { col: 6, row: 0, type: 2 },
                { col: 5, row: 1, type: 2 }, { col: 6, row: 1, type: 2 },
                { col: 5, row: 2, type: 2 }, { col: 6, row: 2, type: 2 },
                { col: 5, row: 3, type: 2 }, { col: 6, row: 3, type: 2 },
                { col: 5, row: 4, type: 5 }, { col: 6, row: 4, type: 5 },
                { col: 5, row: 5, type: 2 }, { col: 6, row: 5, type: 2 },
                { col: 5, row: 6, type: 2 }, { col: 6, row: 6, type: 2 },
                { col: 5, row: 7, type: 2 }, { col: 6, row: 7, type: 2 },
                { col: 5, row: 8, type: 2 }, { col: 6, row: 8, type: 2 },
                { col: 5, row: 9, type: 5 }, { col: 6, row: 9, type: 5 },
                { col: 5, row: 10, type: 2 }, { col: 6, row: 10, type: 2 },
                { col: 5, row: 11, type: 2 }, { col: 6, row: 11, type: 2 },
                { col: 5, row: 12, type: 2 }, { col: 6, row: 12, type: 2 },
                { col: 5, row: 13, type: 2 }, { col: 6, row: 13, type: 2 },
                { col: 5, row: 14, type: 5 }, { col: 6, row: 14, type: 5 },
                { col: 5, row: 15, type: 2 }, { col: 6, row: 15, type: 2 },
                { col: 5, row: 16, type: 2 }, { col: 6, row: 16, type: 2 },
                { col: 5, row: 17, type: 2 }, { col: 6, row: 17, type: 2 },
            ]
        },
        // Level 3: Cat Central - rocks and trees
        {
            obstacles: [
                // Rock clusters
                { col: 2, row: 3, type: 3 }, { col: 3, row: 3, type: 3 },
                { col: 2, row: 4, type: 3 },
                { col: 8, row: 2, type: 3 }, { col: 9, row: 2, type: 3 },
                { col: 9, row: 3, type: 3 },
                { col: 5, row: 13, type: 3 }, { col: 5, row: 14, type: 3 },
                { col: 6, row: 14, type: 3 },
                // Tree clusters
                { col: 3, row: 7, type: 4 }, { col: 4, row: 7, type: 4 },
                { col: 3, row: 8, type: 4 },
                { col: 8, row: 11, type: 4 }, { col: 9, row: 11, type: 4 },
                { col: 8, row: 12, type: 4 },
                { col: 1, row: 15, type: 4 }, { col: 2, row: 15, type: 4 },
                { col: 10, row: 5, type: 4 }, { col: 10, row: 6, type: 4 },
            ]
        }
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
            description: 'Fast single-target',
            ability: { name: 'BARK STORM', desc: 'Rapid fire 10s', cooldown: 50, duration: 10 }
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
            description: 'Rapid fire + slow',
            ability: { name: 'DAZZLE', desc: 'Enemies take 2x damage 10s', cooldown: 50, duration: 10 }
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
            description: 'AoE freeze howl',
            ability: { name: 'BLIZZARD', desc: 'Freeze in range 10s', cooldown: 50, duration: 10 }
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
            description: 'Splash damage WOOF',
            ability: { name: 'MEGA WOOF', desc: 'Damage all enemies 10s', cooldown: 50, duration: 10 }
        },
        sparky: {
            name: 'Sparky',
            emoji: '⚡',
            cost: 75,
            range: 2.5,
            damage: 12,
            fireRate: 1.4,
            color: '#FFD700',
            projectileColor: '#FFEB3B',
            projectileSpeed: 8,
            splash: 0,
            slow: 0,
            description: 'Chain lightning',
            chainCount: 3,
            chainRange: 1.5,
            chainFalloff: 0.6,
            ability: { name: 'THUNDER STORM', desc: 'Double chains 10s', cooldown: 50, duration: 10 }
        },
        doghouse: {
            name: 'Dog House',
            emoji: '🏠',
            cost: 80,
            range: 0,
            damage: 0,
            fireRate: 999,
            color: '#A0522D',
            projectileColor: '#A0522D',
            projectileSpeed: 0,
            splash: 0,
            slow: 0,
            description: 'Income + aura',
            isPassive: true,
            goldPerWave: 8
        }
    },

    // Dog House upgrade tiers — each level adds a new aura buff
    DOGHOUSE_TIERS: [
        // Level 1: income only
        { goldPerWave: 8, auraRange: 0, fireRateMult: 1, rangePlus: 0, damageMult: 1,
          label: '+8g/wave', next: 'Lv2: +15% Atk Speed aura' },
        // Level 2: + attack speed aura
        { goldPerWave: 10, auraRange: 2, fireRateMult: 0.85, rangePlus: 0, damageMult: 1,
          label: '+10g/wave | +15% Atk Spd', next: 'Lv3: +Range aura' },
        // Level 3: + range aura
        { goldPerWave: 12, auraRange: 2.5, fireRateMult: 0.85, rangePlus: 0.5, damageMult: 1,
          label: '+12g/wave | +Spd | +Range', next: 'Lv4: +20% Damage aura' },
        // Level 4: + damage aura
        { goldPerWave: 15, auraRange: 3, fireRateMult: 0.85, rangePlus: 0.75, damageMult: 1.2,
          label: '+15g/wave | +Spd | +Rng | +Dmg' },
    ],

    // Enemy definitions
    ENEMIES: {
        kitten: {
            name: 'Kitten',
            emoji: '🐱',
            hp: 30,
            speed: 1.25,
            gold: 10,
            color: '#FFD700',
            armor: 0,
            size: 0.3
        },
        tabby: {
            name: 'Tabby',
            emoji: '🐈',
            hp: 80,
            speed: 0.9,
            gold: 20,
            color: '#FF8C00',
            armor: 0,
            size: 0.35
        },
        fatcat: {
            name: 'Fat Cat',
            emoji: '🐈‍⬛',
            hp: 200,
            speed: 0.5,
            gold: 50,
            color: '#4A4A4A',
            armor: 5,
            size: 0.45
        },
        ninja: {
            name: 'Ninja Cat',
            emoji: '🥷',
            hp: 40,
            speed: 1.75,
            gold: 25,
            color: '#2C2C2C',
            armor: 0,
            size: 0.28,
            dodgeFirst: true
        },
        chonker: {
            name: 'Chonker',
            emoji: '😺',
            hp: 500,
            speed: 0.3,
            gold: 75,
            color: '#FF6B6B',
            armor: 8,
            size: 0.55,
            slowImmune: true
        },
        boss: {
            name: 'Boss Cat',
            emoji: '👑',
            hp: 1000,
            speed: 0.4,
            gold: 200,
            color: '#9C27B0',
            armor: 5,
            size: 0.7,
            isBoss: true
        }
    },

    // Wave system
    SETUP_TIME: 7,       // seconds to place towers before first wave each level
    WAVE_DELAY: 5,
    SPAWN_INTERVAL: 0.6,

    // Trivia - themed pools per level (20 questions each)
    TRIVIA_TIME: 5,     // seconds to answer
    TRIVIA_REWARD: 100,  // gold for correct answer
    TRIVIA: [
        // Level 1: The Backyard - Basic dog breed facts
        [
            { q: "What breed is the world's fastest dog?", a: ['Greyhound', 'Whippet', 'Saluki', 'Dalmatian'], c: 0 },
            { q: "Which breed is the smallest?", a: ['Chihuahua', 'Yorkie', 'Pomeranian', 'Papillon'], c: 0 },
            { q: "What breed was Lassie?", a: ['Rough Collie', 'Sheltie', 'Golden Retriever', 'Beagle'], c: 0 },
            { q: "What breed is known as the 'Wiener Dog'?", a: ['Dachshund', 'Corgi', 'Basset Hound', 'Beagle'], c: 0 },
            { q: "Which breed has a blue-black tongue?", a: ['Chow Chow', 'Akita', 'Shar Pei', 'Husky'], c: 0 },
            { q: "Which breed can't bark?", a: ['Basenji', 'Shiba Inu', 'Whippet', 'Borzoi'], c: 0 },
            { q: "Which breed is the tallest?", a: ['Great Dane', 'Irish Wolfhound', 'Mastiff', 'St. Bernard'], c: 0 },
            { q: "Which breed is the heaviest?", a: ['English Mastiff', 'Great Dane', 'St. Bernard', 'Newfoundland'], c: 0 },
            { q: "Which breed was bred for Alpine rescue?", a: ['St. Bernard', 'Bernese Mountain', 'Husky', 'Malamute'], c: 0 },
            { q: "What breed is Scooby-Doo?", a: ['Great Dane', 'Bloodhound', 'Mastiff', 'Boxer'], c: 0 },
            { q: "Which is the 'Firehouse Dog' breed?", a: ['Dalmatian', 'Lab', 'German Shepherd', 'Boxer'], c: 0 },
            { q: "Which breed is most popular in the US?", a: ['Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'Bulldog'], c: 0 },
            { q: "Which breed is known for herding sheep?", a: ['Border Collie', 'Poodle', 'Beagle', 'Boxer'], c: 0 },
            { q: "Dalmatian puppies are born what color?", a: ['White', 'Spotted', 'Black', 'Gray'], c: 0 },
            { q: "Which breed has 'lion' in its name?", a: ['Leonberger', 'Rhodesian', 'Tibetan Mastiff', 'Chow Chow'], c: 0 },
            { q: "What breed is Toto from Oz?", a: ['Cairn Terrier', 'Yorkie', 'Schnauzer', 'Maltese'], c: 0 },
            { q: "Which breed is known as 'Velcro dog'?", a: ['Vizsla', 'Weimaraner', 'Lab', 'Golden Retriever'], c: 0 },
            { q: "Which breed originated in Japan?", a: ['Shiba Inu', 'Chow Chow', 'Shar Pei', 'Lhasa Apso'], c: 0 },
            { q: "What breed is known for its wrinkles?", a: ['Shar Pei', 'Bulldog', 'Pug', 'Mastiff'], c: 0 },
            { q: "Which breed has webbed feet for swimming?", a: ['Labrador', 'Dalmatian', 'Beagle', 'Poodle'], c: 0 },
        ],
        // Level 2: The Park - Dog behavior, training & anatomy
        [
            { q: "How many teeth does an adult dog have?", a: ['42', '36', '28', '48'], c: 0 },
            { q: "What is a group of puppies called?", a: ['A litter', 'A pack', 'A herd', 'A pod'], c: 0 },
            { q: "How many eyelids does a dog have per eye?", a: ['Three', 'Two', 'One', 'Four'], c: 0 },
            { q: "Which sense is strongest in dogs?", a: ['Smell', 'Hearing', 'Sight', 'Taste'], c: 0 },
            { q: "Dogs can see which colors best?", a: ['Blue & yellow', 'Red & green', 'All colors', 'Only gray'], c: 0 },
            { q: "How many muscles control a dog's ear?", a: ['18', '6', '12', '24'], c: 0 },
            { q: "Dogs sweat mainly through their...?", a: ['Paw pads', 'Tongue', 'Nose', 'Belly'], c: 0 },
            { q: "A dog's nose print is unique like a...?", a: ['Fingerprint', 'Snowflake', 'DNA strand', 'Retina'], c: 0 },
            { q: "How many bones does a dog have?", a: ['~320', '~200', '~400', '~260'], c: 0 },
            { q: "What is a female dog called?", a: ['A dam', 'A queen', 'A hen', 'A mare'], c: 0 },
            { q: "Puppies are born deaf and...?", a: ['Blind', 'Hairless', 'Toothless', 'Tailless'], c: 0 },
            { q: "A wagging tail always means happy?", a: ['No', 'Yes', 'Only for puppies', 'Only small dogs'], c: 0 },
            { q: "Dogs curl up when sleeping to...?", a: ['Protect organs', 'Stay warm', 'Feel safe', 'All of these'], c: 3 },
            { q: "How far can a dog smell?", a: ['Up to 12 miles', 'Up to 1 mile', 'Up to 100 feet', 'Up to 50 miles'], c: 0 },
            { q: "Why do dogs tilt their heads?", a: ['To hear better', 'They are confused', 'To see around their muzzle', 'To look cute'], c: 2 },
            { q: "What does a play bow signal?", a: ['Want to play', 'Submission', 'Fear', 'Hunger'], c: 0 },
            { q: "How many taste buds do dogs have?", a: ['~1,700', '~10,000', '~500', '~5,000'], c: 0 },
            { q: "Dogs dream during which sleep phase?", a: ['REM sleep', 'Deep sleep', 'Light sleep', 'Dogs don\'t dream'], c: 0 },
            { q: "A dog's normal temperature is about...?", a: ['101-102\u00B0F', '98.6\u00B0F', '104-106\u00B0F', '95-97\u00B0F'], c: 0 },
            { q: "Puppies open their eyes at about...?", a: ['2 weeks', '1 day', '1 week', '1 month'], c: 0 },
        ],
        // Level 3: Cat Central - Advanced dog trivia + cat facts
        [
            { q: "How many hours a day do cats sleep?", a: ['12-16', '6-8', '8-10', '18-22'], c: 0 },
            { q: "Cats can rotate their ears how far?", a: ['180 degrees', '90 degrees', '360 degrees', '45 degrees'], c: 0 },
            { q: "How many whiskers does a cat have?", a: ['About 24', 'About 12', 'About 50', 'About 6'], c: 0 },
            { q: "A group of cats is called a...?", a: ['Clowder', 'Pack', 'Litter', 'Murder'], c: 0 },
            { q: "Cats can't taste which flavor?", a: ['Sweet', 'Sour', 'Bitter', 'Salty'], c: 0 },
            { q: "What is a cat's top running speed?", a: ['30 mph', '15 mph', '45 mph', '60 mph'], c: 0 },
            { q: "How many toes does a normal cat have?", a: ['18', '16', '20', '14'], c: 0 },
            { q: "Cat purring frequency can promote...?", a: ['Bone healing', 'Hair growth', 'Weight loss', 'Nothing'], c: 0 },
            { q: "Cats spend what % of time grooming?", a: ['30-50%', '5-10%', '10-15%', '70-80%'], c: 0 },
            { q: "A cat's brain is most similar to a...?", a: ['Human\'s', 'Dog\'s', 'Bird\'s', 'Fish\'s'], c: 0 },
            { q: "Dogs have how many more smell receptors than humans?", a: ['~50x more', '~5x more', '~10x more', '~100x more'], c: 0 },
            { q: "The oldest known dog lived to be...?", a: ['31 years', '25 years', '22 years', '29 years'], c: 0 },
            { q: "Which US president had the most dogs?", a: ['Theodore Roosevelt', 'George Washington', 'Obama', 'Biden'], c: 0 },
            { q: "Dogs can understand about how many words?", a: ['Up to 250', 'Up to 50', 'Up to 25', 'Up to 1000'], c: 0 },
            { q: "A dog's hearing range goes up to...?", a: ['65,000 Hz', '20,000 Hz', '40,000 Hz', '100,000 Hz'], c: 0 },
            { q: "Which country has the most pet dogs?", a: ['USA', 'China', 'Brazil', 'Russia'], c: 0 },
            { q: "Cats have how many vertebrae?", a: ['53', '33', '42', '26'], c: 0 },
            { q: "Dogs were domesticated roughly how long ago?", a: ['15,000 years', '5,000 years', '1,000 years', '50,000 years'], c: 0 },
            { q: "Cats land on their feet due to their...?", a: ['Righting reflex', 'Light bones', 'Tail balance', 'Flexible spine'], c: 0 },
            { q: "A dog's sense of smell is how much better than ours?", a: ['10,000-100,000x', '100-500x', '10-50x', '1,000x'], c: 0 },
        ],
    ],

    // Score
    SCORE_PER_KILL: 10,
    SCORE_PER_LIFE: 50,

    // Leaderboard
    LEADERBOARD_KEY: 'puppy_defender_scores',
    LEADERBOARD_MAX: 10,

    // Super Towers — formed by merging 3-in-a-line of the same type
    SUPER_TOWERS: {
        barker: {
            name: 'Alpha Barker', emoji: '🦮', color: '#B8860B',
            damage: 20, range: 4.5, fireRate: 0.7,
            projectileColor: '#FFD700', projectileSpeed: 7,
            splash: 0, slow: 0, slowDuration: 0,
            perk: 'tripleShot',
            description: 'Triple shot'
        },
        poodle: {
            name: 'Diamond Poodle', emoji: '💎', color: '#E1BEE7',
            damage: 12, range: 3.5, fireRate: 0.5,
            projectileColor: '#CE93D8', projectileSpeed: 6,
            splash: 1.5, slow: 0.5, slowDuration: 3,
            perk: 'freezeBlast',
            description: 'AoE freeze'
        },
        husky: {
            name: 'Arctic Husky', emoji: '❄️', color: '#81D4FA',
            damage: 8, range: 3.5, fireRate: 0.5,
            projectileColor: '#B3E5FC', projectileSpeed: 0,
            splash: 0, slow: 0.4, slowDuration: 2,
            perk: 'frostZone',
            description: 'Frost zone aura'
        },
        sparky: {
            name: 'Mega Sparky', emoji: '🌩️', color: '#FFC107',
            damage: 30, range: 3.5, fireRate: 1.2,
            projectileColor: '#FFEB3B', projectileSpeed: 10,
            splash: 0, slow: 0, slowDuration: 0,
            chainCount: 8, chainRange: 2.5, chainFalloff: 0.8,
            perk: 'megaChain',
            description: 'Chain everything'
        },
        bigboi: {
            name: 'Titan Boi', emoji: '💥', color: '#6D4C41',
            damage: 60, range: 3, fireRate: 2.0,
            projectileColor: '#FF5722', projectileSpeed: 5,
            splash: 2.5, slow: 0, slowDuration: 0,
            perk: 'stun',
            description: 'Earthquake + stun'
        },
        doghouse: {
            name: 'Dog Mansion', emoji: '🏰', color: '#8B4513',
            goldPerWave: 25, auraRange: 5,
            fireRateMult: 0.75, rangePlus: 1.0, damageMult: 1.3,
            perk: 'mansion',
            description: 'Ultimate aura'
        }
    },

    // Visual
    GRASS_COLOR: '#4A7C2E',
    GRASS_COLOR_ALT: '#3D6B25',
    PATH_COLOR: '#8B7355',
    GRID_LINE_COLOR: 'rgba(0,0,0,0.06)',
    RANGE_COLOR: 'rgba(255,255,255,0.08)',
    BLOCKED_COLOR: 'rgba(255,60,60,0.3)',
    VALID_COLOR: 'rgba(100,255,100,0.25)',
};
