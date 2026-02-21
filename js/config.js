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

    // Tower definitions
    TOWERS: {
        barker: {
            name: 'Barker',
            emoji: '🐕',
            cost: 50,
            range: 3,
            damage: 8,
            fireRate: 0.8, // seconds between shots
            color: '#D2691E',
            projectileColor: '#F5DEB3',
            projectileSpeed: 6,
            splash: 0,
            slow: 0,
            description: 'Fast single-target bark'
        },
        bigboi: {
            name: 'Big Boi',
            emoji: '🐶',
            cost: 100,
            range: 2,
            damage: 25,
            fireRate: 1.8,
            color: '#8B4513',
            projectileColor: '#FF6347',
            projectileSpeed: 4,
            splash: 1.5, // splash radius in tiles
            slow: 0,
            description: 'Splash damage WOOF'
        },
        poodle: {
            name: 'Poodle',
            emoji: '🐩',
            cost: 75,
            range: 2.5,
            damage: 3,
            fireRate: 1.0,
            color: '#FFB6C1',
            projectileColor: '#DA70D6',
            projectileSpeed: 5,
            splash: 0,
            slow: 0.5, // slow factor (0.5 = 50% speed for 2 sec)
            slowDuration: 2,
            description: 'Slows enemies'
        }
    },

    UPGRADE_COST_MULT: 1.0, // upgrade cost = base cost * this
    UPGRADE_STAT_MULT: 1.5, // stats multiplied by this on upgrade

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
            armor: 5, // flat damage reduction
            size: 0.45
        }
    },

    // Wave system
    TOTAL_WAVES: 20,
    WAVE_DELAY: 5, // seconds between waves (planning time)
    SPAWN_INTERVAL: 0.6, // seconds between enemy spawns within a wave

    // Visual
    GRASS_COLOR: '#4A7C2E',
    GRASS_COLOR_ALT: '#3D6B25',
    PATH_COLOR: '#8B7355',
    GRID_LINE_COLOR: 'rgba(0,0,0,0.06)',
    RANGE_COLOR: 'rgba(255,255,255,0.08)',
    BLOCKED_COLOR: 'rgba(255,60,60,0.3)',
    VALID_COLOR: 'rgba(100,255,100,0.25)',
};
