// Village Map Data - Barksville & Puppy Academy
// Rich detailed maps for FF7-style bird's-eye exploration

// Helper: fill a rectangular region in a 1D tile array
function _fillRect(arr, w, x, y, fw, fh, val) {
    for (let r = y; r < y + fh; r++) {
        for (let c = x; c < x + fw; c++) {
            arr[r * w + c] = val;
        }
    }
}

// ===========================
// PUPPY ACADEMY GROUNDS
// ===========================
const VILLAGE_ACADEMY = (() => {
    const W = 30, H = 30;
    const tiles = new Array(W * H).fill(TILE.GRASS);
    const objects = new Array(W * H).fill(OBJ.NONE);
    const roofs = new Array(W * H).fill(0);
    const collisions = new Array(W * H).fill(0);

    // === MAIN BUILDING (Academy) - top center ===
    // Walls
    _fillRect(tiles, W, 10, 2, 10, 7, TILE.WALL);
    // Interior floor
    _fillRect(tiles, W, 11, 3, 8, 5, TILE.FLOOR);
    // Front door
    tiles[8 * W + 14] = TILE.DOOR;
    tiles[8 * W + 15] = TILE.DOOR;
    // Roof
    _fillRect(roofs, W, 11, 3, 8, 5, 1);
    // Windows on front wall
    objects[7 * W + 12] = OBJ.WINDOW;
    objects[7 * W + 17] = OBJ.WINDOW;
    // Chimney
    objects[2 * W + 18] = OBJ.CHIMNEY;

    // === INFIRMARY - right side ===
    _fillRect(tiles, W, 22, 4, 6, 5, TILE.WALL);
    _fillRect(tiles, W, 23, 5, 4, 3, TILE.FLOOR);
    tiles[8 * W + 24] = TILE.DOOR;
    _fillRect(roofs, W, 23, 5, 4, 3, 1);
    objects[7 * W + 25] = OBJ.WINDOW;

    // === KENNEL - left side ===
    _fillRect(tiles, W, 2, 4, 6, 5, TILE.WALL);
    _fillRect(tiles, W, 3, 5, 4, 3, TILE.FLOOR);
    tiles[8 * W + 4] = TILE.DOOR;
    tiles[8 * W + 5] = TILE.DOOR;
    _fillRect(roofs, W, 3, 5, 4, 3, 1);
    objects[7 * W + 3] = OBJ.WINDOW;
    objects[7 * W + 6] = OBJ.WINDOW;

    // === MAIN PATH - vertical center ===
    _fillRect(tiles, W, 13, 9, 4, 12, TILE.PATH);
    // Horizontal path connecting buildings
    _fillRect(tiles, W, 5, 9, 20, 2, TILE.PATH);
    // Path to south exit
    _fillRect(tiles, W, 14, 21, 2, 9, TILE.PATH);

    // === TRAINING YARD - left side ===
    _fillRect(tiles, W, 2, 12, 8, 6, TILE.SAND);
    // Fence around training yard
    _fillRect(tiles, W, 2, 12, 8, 1, TILE.FENCE);
    _fillRect(tiles, W, 2, 17, 8, 1, TILE.FENCE);
    _fillRect(tiles, W, 2, 12, 1, 6, TILE.FENCE);
    _fillRect(tiles, W, 9, 12, 1, 6, TILE.FENCE);
    // Gate opening
    tiles[12 * W + 5] = TILE.PATH;
    tiles[12 * W + 6] = TILE.PATH;
    collisions[12 * W + 5] = 0;
    collisions[12 * W + 6] = 0;

    // === POND - right side ===
    _fillRect(tiles, W, 22, 13, 6, 4, TILE.WATER);
    // Shore flowers
    tiles[12 * W + 22] = TILE.FLOWERS;
    tiles[12 * W + 23] = TILE.FLOWERS;
    tiles[12 * W + 27] = TILE.FLOWERS;
    tiles[17 * W + 23] = TILE.FLOWERS;
    tiles[17 * W + 26] = TILE.FLOWERS;

    // === GARDEN AREA - bottom left ===
    _fillRect(tiles, W, 2, 20, 6, 4, TILE.DARK_GRASS);
    tiles[20 * W + 3] = TILE.FLOWERS;
    tiles[20 * W + 6] = TILE.FLOWERS;
    tiles[22 * W + 4] = TILE.FLOWERS;
    tiles[23 * W + 2] = TILE.FLOWERS;
    tiles[21 * W + 7] = TILE.FLOWERS;
    objects[21 * W + 3] = OBJ.FLOWER_BED;
    objects[21 * W + 6] = OBJ.FLOWER_BED;

    // === STORAGE SHED - bottom right ===
    _fillRect(tiles, W, 23, 20, 5, 4, TILE.WALL);
    _fillRect(tiles, W, 24, 21, 3, 2, TILE.FLOOR);
    tiles[23 * W + 25] = TILE.DOOR;
    _fillRect(roofs, W, 24, 21, 3, 2, 1);

    // === OBJECTS - Trees border ===
    // Top border
    for (let c = 0; c < W; c += 2) {
        if (c < 9 || c > 20) objects[0 * W + c] = OBJ.TREE_OAK;
        if (c < 9 || c > 20) objects[1 * W + c] = OBJ.TREE_PINE;
    }
    // Left border
    for (let r = 0; r < H; r += 3) {
        if (r < 3 || (r > 9 && r < 12) || r > 24) objects[r * W + 0] = OBJ.TREE_OAK;
    }
    // Right border
    for (let r = 0; r < H; r += 3) {
        if (r < 3 || (r > 9 && r < 12) || r > 24) objects[r * W + 29] = OBJ.TREE_PINE;
    }
    // Bottom border
    for (let c = 0; c < W; c += 2) {
        if (c < 13 || c > 16) objects[29 * W + c] = OBJ.TREE_OAK;
    }

    // Scattered trees around grounds
    objects[11 * W + 11] = OBJ.TREE_OAK;
    objects[15 * W + 20] = OBJ.TREE_OAK;
    objects[19 * W + 11] = OBJ.TREE_PINE;
    objects[25 * W + 10] = OBJ.TREE_OAK;
    objects[25 * W + 20] = OBJ.TREE_PINE;

    // Bushes
    objects[10 * W + 10] = OBJ.BUSH;
    objects[10 * W + 20] = OBJ.BUSH;
    objects[18 * W + 20] = OBJ.BUSH;
    objects[24 * W + 8] = OBJ.BUSH;

    // Lamp posts along main path
    objects[10 * W + 12] = OBJ.LAMP;
    objects[10 * W + 17] = OBJ.LAMP;
    objects[15 * W + 12] = OBJ.LAMP;
    objects[20 * W + 13] = OBJ.LAMP;

    // Benches
    objects[11 * W + 18] = OBJ.BENCH;
    objects[16 * W + 18] = OBJ.BENCH;

    // Dog houses in kennel area
    objects[6 * W + 3] = OBJ.DOG_HOUSE;
    objects[6 * W + 5] = OBJ.DOG_HOUSE;

    // Well in the center courtyard
    objects[14 * W + 15] = OBJ.WELL;

    // Fountain near pond
    objects[13 * W + 20] = OBJ.FOUNTAIN;

    // Sign at entrance
    objects[20 * W + 15] = OBJ.SIGN;

    // Mailbox near academy
    objects[9 * W + 11] = OBJ.MAILBOX;

    // Statue in garden
    objects[22 * W + 5] = OBJ.STATUE;

    // Barrels and crates near storage
    objects[22 * W + 23] = OBJ.BARREL;
    objects[22 * W + 27] = OBJ.CRATE;
    objects[24 * W + 27] = OBJ.BARREL;

    // Rocks
    objects[26 * W + 2] = OBJ.ROCK;
    objects[27 * W + 8] = OBJ.ROCK;
    objects[18 * W + 28] = OBJ.ROCK;

    // Build collision map from tiles + objects
    for (let i = 0; i < W * H; i++) {
        const t = tiles[i];
        if (t === TILE.WALL || t === TILE.WATER || t === TILE.ROOF) collisions[i] = 1;
        if (t === TILE.FENCE) collisions[i] = 1;
        const o = objects[i];
        if (o === OBJ.TREE_OAK || o === OBJ.TREE_PINE || o === OBJ.ROCK ||
            o === OBJ.WELL || o === OBJ.FOUNTAIN || o === OBJ.STATUE ||
            o === OBJ.BARREL || o === OBJ.CRATE) {
            collisions[i] = 1;
        }
    }
    // Ensure doors and paths are walkable
    for (let i = 0; i < W * H; i++) {
        if (tiles[i] === TILE.DOOR || tiles[i] === TILE.PATH || tiles[i] === TILE.BRIDGE) {
            collisions[i] = 0;
        }
    }

    return {
        name: 'Puppy Academy',
        width: W, height: H,
        tiles, objects, roofs, collisions,
        startX: 14, startY: 18,
        npcs: [
            {
                id: 'rex', name: 'Old Rex', emoji: '🦮', color: '#c0925a',
                x: 14, y: 10, wander: true,
                dialogue: 'The Academy has been training dogs for generations. Every breed has its own unique strengths.'
            },
            {
                id: 'nurse', name: 'Nurse Fifi', emoji: '🐩', color: '#e8e8e8',
                x: 24, y: 8, wander: false,
                dialogue: 'The infirmary is always open! Did you know puppies need 18-20 hours of sleep per day?'
            },
            {
                id: 'scout', name: 'Scout', emoji: '🐕‍🦺', color: '#8B6840',
                x: 20, y: 14, wander: true,
                dialogue: 'I patrol the perimeter every day. Dogs have a sense of smell 40 times better than humans!'
            },
            {
                id: 'chef', name: 'Chef Biscuit', emoji: '🐕', color: '#d4a060',
                x: 4, y: 10, wander: true,
                dialogue: 'I make the best kibble in Barksville! A healthy diet keeps every pup strong for training.'
            },
            {
                id: 'gardener', name: 'Daisy', emoji: '🐶', color: '#f0d0a0',
                x: 4, y: 21, wander: true,
                dialogue: 'I tend the garden! Dogs actually can see some colors - they see blues and yellows best!'
            },
        ],
        triggers: [
            {
                id: 'south_exit', x: 13, y: 28, w: 4, h: 2,
                visible: true, label: '🚪 Barksville',
                action: 'changeMap', target: 'barksville'
            },
            {
                id: 'academy_door', x: 14, y: 8, w: 2, h: 1,
                visible: false,
                action: 'dialogue', text: 'The Academy main hall. Warm and inviting.'
            },
            {
                id: 'training_yard', x: 3, y: 13, w: 5, h: 3,
                visible: true, label: '⚔️ Training Yard',
                action: 'battle'
            },
        ],
        lights: [
            { x: 14.5, y: 6, radius: 6, color: '255,210,120' },   // main hall warm glow
            { x: 25, y: 6, radius: 4, color: '255,200,100' },      // east wing
            { x: 5, y: 6, radius: 4, color: '255,200,100' },       // west wing
            { x: 14.5, y: 14, radius: 3, color: '200,255,180' },   // training yard mako glow
            { x: 10, y: 2, radius: 3, color: '255,180,80' },       // north torch
            { x: 20, y: 2, radius: 3, color: '255,180,80' },       // north torch
            { x: 14.5, y: 10, radius: 2.5, color: '180,220,255' }, // fountain cool light
        ]
    };
})();


// ===========================
// BARKSVILLE TOWN
// ===========================
const VILLAGE_BARKSVILLE = (() => {
    const W = 40, H = 35;
    const tiles = new Array(W * H).fill(TILE.GRASS);
    const objects = new Array(W * H).fill(OBJ.NONE);
    const roofs = new Array(W * H).fill(0);
    const collisions = new Array(W * H).fill(0);

    // === MAIN STREET - horizontal through town ===
    _fillRect(tiles, W, 0, 15, 40, 3, TILE.PATH);
    // Cross street - vertical
    _fillRect(tiles, W, 18, 0, 3, 35, TILE.PATH);

    // === TOWN SQUARE - center intersection ===
    _fillRect(tiles, W, 15, 12, 9, 9, TILE.STONE);
    _fillRect(tiles, W, 17, 14, 5, 5, TILE.STONE);

    // === BAKERY - northwest ===
    _fillRect(tiles, W, 3, 4, 8, 6, TILE.WALL);
    _fillRect(tiles, W, 4, 5, 6, 4, TILE.FLOOR);
    tiles[9 * W + 6] = TILE.DOOR;
    tiles[9 * W + 7] = TILE.DOOR;
    _fillRect(roofs, W, 4, 5, 6, 4, 1);
    objects[8 * W + 5] = OBJ.WINDOW;
    objects[8 * W + 8] = OBJ.WINDOW;
    objects[4 * W + 9] = OBJ.CHIMNEY;

    // === PET SHOP - northeast ===
    _fillRect(tiles, W, 25, 4, 9, 6, TILE.WALL);
    _fillRect(tiles, W, 26, 5, 7, 4, TILE.FLOOR);
    tiles[9 * W + 28] = TILE.DOOR;
    tiles[9 * W + 29] = TILE.DOOR;
    _fillRect(roofs, W, 26, 5, 7, 4, 1);
    objects[8 * W + 27] = OBJ.WINDOW;
    objects[8 * W + 31] = OBJ.WINDOW;

    // === TOWN HALL - large building east ===
    _fillRect(tiles, W, 28, 19, 10, 8, TILE.WALL);
    _fillRect(tiles, W, 29, 20, 8, 6, TILE.FLOOR);
    tiles[26 * W + 32] = TILE.DOOR;
    tiles[26 * W + 33] = TILE.DOOR;
    _fillRect(roofs, W, 29, 20, 8, 6, 1);
    objects[25 * W + 30] = OBJ.WINDOW;
    objects[25 * W + 34] = OBJ.WINDOW;
    objects[23 * W + 30] = OBJ.WINDOW;
    objects[23 * W + 34] = OBJ.WINDOW;
    objects[19 * W + 36] = OBJ.CHIMNEY;

    // === RESIDENTIAL - southwest houses ===
    // House 1
    _fillRect(tiles, W, 2, 20, 6, 5, TILE.WALL);
    _fillRect(tiles, W, 3, 21, 4, 3, TILE.FLOOR);
    tiles[24 * W + 5] = TILE.DOOR;
    _fillRect(roofs, W, 3, 21, 4, 3, 1);
    objects[23 * W + 3] = OBJ.WINDOW;

    // House 2
    _fillRect(tiles, W, 10, 20, 6, 5, TILE.WALL);
    _fillRect(tiles, W, 11, 21, 4, 3, TILE.FLOOR);
    tiles[24 * W + 13] = TILE.DOOR;
    _fillRect(roofs, W, 11, 21, 4, 3, 1);
    objects[23 * W + 12] = OBJ.WINDOW;
    objects[20 * W + 14] = OBJ.CHIMNEY;

    // Small paths to houses
    _fillRect(tiles, W, 5, 24, 1, 3, TILE.PATH);
    _fillRect(tiles, W, 13, 24, 1, 3, TILE.PATH);
    _fillRect(tiles, W, 5, 15, 1, 6, TILE.PATH);
    _fillRect(tiles, W, 13, 15, 1, 6, TILE.PATH);

    // === RIVER - southern edge ===
    _fillRect(tiles, W, 0, 30, 40, 3, TILE.WATER);
    // Bridge over river
    _fillRect(tiles, W, 17, 30, 5, 3, TILE.BRIDGE);

    // === PARK AREA - south of river (start of park) ===
    _fillRect(tiles, W, 12, 33, 15, 2, TILE.DARK_GRASS);
    tiles[33 * W + 15] = TILE.FLOWERS;
    tiles[33 * W + 20] = TILE.FLOWERS;
    tiles[34 * W + 18] = TILE.FLOWERS;

    // === NORTH PATH to Academy ===
    _fillRect(tiles, W, 18, 0, 3, 4, TILE.PATH);

    // === OBJECTS ===

    // Town square fountain
    objects[16 * W + 19] = OBJ.FOUNTAIN;

    // Town square benches
    objects[13 * W + 16] = OBJ.BENCH;
    objects[13 * W + 22] = OBJ.BENCH;
    objects[19 * W + 16] = OBJ.BENCH;
    objects[19 * W + 22] = OBJ.BENCH;

    // Lamp posts along main street
    objects[14 * W + 5] = OBJ.LAMP;
    objects[14 * W + 10] = OBJ.LAMP;
    objects[14 * W + 25] = OBJ.LAMP;
    objects[14 * W + 33] = OBJ.LAMP;
    // Lamps along cross street
    objects[7 * W + 17] = OBJ.LAMP;
    objects[25 * W + 17] = OBJ.LAMP;

    // Signs
    objects[10 * W + 6] = OBJ.SIGN; // Bakery sign
    objects[10 * W + 28] = OBJ.SIGN; // Pet shop sign

    // Mailboxes
    objects[24 * W + 4] = OBJ.MAILBOX;
    objects[24 * W + 12] = OBJ.MAILBOX;

    // Dog houses
    objects[25 * W + 7] = OBJ.DOG_HOUSE;
    objects[25 * W + 14] = OBJ.DOG_HOUSE;

    // Trees all around edges
    for (let c = 0; c < W; c += 2) {
        if (tiles[0 * W + c] === TILE.GRASS) objects[0 * W + c] = c % 4 === 0 ? OBJ.TREE_OAK : OBJ.TREE_PINE;
        if (tiles[1 * W + c] === TILE.GRASS) objects[1 * W + c] = c % 4 === 2 ? OBJ.TREE_OAK : OBJ.TREE_PINE;
    }
    for (let r = 2; r < H; r += 3) {
        if (tiles[r * W + 0] === TILE.GRASS) objects[r * W + 0] = OBJ.TREE_OAK;
        if (tiles[r * W + 1] === TILE.GRASS) objects[r * W + 1] = OBJ.TREE_PINE;
        if (tiles[r * W + 38] === TILE.GRASS) objects[r * W + 38] = OBJ.TREE_OAK;
        if (tiles[r * W + 39] === TILE.GRASS) objects[r * W + 39] = OBJ.TREE_PINE;
    }

    // Scattered trees
    objects[11 * W + 2] = OBJ.TREE_OAK;
    objects[11 * W + 13] = OBJ.TREE_OAK;
    objects[12 * W + 35] = OBJ.TREE_PINE;
    objects[27 * W + 5] = OBJ.TREE_OAK;
    objects[28 * W + 12] = OBJ.TREE_PINE;
    objects[27 * W + 35] = OBJ.TREE_OAK;

    // Bushes
    objects[10 * W + 15] = OBJ.BUSH;
    objects[10 * W + 23] = OBJ.BUSH;
    objects[12 * W + 2] = OBJ.BUSH;
    objects[26 * W + 25] = OBJ.BUSH;
    objects[29 * W + 7] = OBJ.BUSH;
    objects[29 * W + 33] = OBJ.BUSH;

    // Flower beds near houses
    objects[25 * W + 3] = OBJ.FLOWER_BED;
    objects[25 * W + 10] = OBJ.FLOWER_BED;

    // Barrels and crates near shops
    objects[10 * W + 3] = OBJ.BARREL;
    objects[10 * W + 10] = OBJ.CRATE;
    objects[10 * W + 33] = OBJ.BARREL;

    // Rocks
    objects[28 * W + 8] = OBJ.ROCK;
    objects[29 * W + 25] = OBJ.ROCK;
    objects[3 * W + 22] = OBJ.ROCK;

    // Town statue in square
    objects[14 * W + 19] = OBJ.STATUE;

    // Build collision map
    for (let i = 0; i < W * H; i++) {
        const t = tiles[i];
        if (t === TILE.WALL || t === TILE.WATER || t === TILE.FENCE) collisions[i] = 1;
        const o = objects[i];
        if (o === OBJ.TREE_OAK || o === OBJ.TREE_PINE || o === OBJ.ROCK ||
            o === OBJ.WELL || o === OBJ.FOUNTAIN || o === OBJ.STATUE ||
            o === OBJ.BARREL || o === OBJ.CRATE) {
            collisions[i] = 1;
        }
    }
    for (let i = 0; i < W * H; i++) {
        if (tiles[i] === TILE.DOOR || tiles[i] === TILE.PATH ||
            tiles[i] === TILE.BRIDGE || tiles[i] === TILE.STONE) {
            collisions[i] = 0;
        }
    }

    return {
        name: 'Barksville',
        width: W, height: H,
        tiles, objects, roofs, collisions,
        startX: 19, startY: 2,
        npcs: [
            {
                id: 'baker', name: 'Baker Bones', emoji: '🧑‍🍳', color: '#e8c898',
                x: 6, y: 12, wander: true,
                dialogue: 'Fresh biscuits every morning! Dogs have about 1,700 taste buds, while humans have 9,000. But a dog\'s sense of smell more than makes up for it!'
            },
            {
                id: 'shopkeeper', name: 'Mr. Pawsworth', emoji: '🧓', color: '#c0a080',
                x: 29, y: 12, wander: true,
                dialogue: 'Welcome to the Pet Shop! I stock the finest treats and toys. Did you know dogs have three eyelids? The third one helps keep their eyes moist!'
            },
            {
                id: 'mayor', name: 'Mayor Waggins', emoji: '🎩', color: '#8B6840',
                x: 19, y: 16, wander: true,
                dialogue: 'Welcome to Barksville! Our town has been a safe haven for dogs for over 100 years. A group of dogs is called a pack, but did you know a group of puppies is called a litter?'
            },
            {
                id: 'stray1', name: 'Patches', emoji: '🐕', color: '#a08060',
                x: 7, y: 25, wander: true,
                dialogue: 'I used to be a stray, but Barksville took me in! Every dog deserves a home. Dogs can dream just like humans — you might see them twitching in their sleep!'
            },
            {
                id: 'guard', name: 'Sergeant Bark', emoji: '🐕‍🦺', color: '#505050',
                x: 33, y: 24, wander: false,
                dialogue: 'I guard the Town Hall day and night. German Shepherds like me were originally bred for herding sheep, but now we serve in police and military roles worldwide!'
            },
            {
                id: 'pup_playing', name: 'Zippy', emoji: '🐶', color: '#f0d0a0',
                x: 16, y: 17, wander: true,
                dialogue: 'Tag, you\'re it! *zooms around* Did you know puppies are born deaf and blind? They can\'t hear or see until they\'re about two weeks old!'
            },
        ],
        triggers: [
            {
                id: 'north_to_academy', x: 17, y: 0, w: 5, h: 2,
                visible: true, label: '🏫 Academy',
                action: 'changeMap', target: 'academy'
            },
            {
                id: 'south_bridge', x: 17, y: 32, w: 5, h: 2,
                visible: true, label: '🌳 The Park',
                action: 'changeMap', target: 'park'
            },
            {
                id: 'bakery_door', x: 6, y: 9, w: 2, h: 1,
                visible: false,
                action: 'dialogue', text: 'Bones\' Bakery — The smell of fresh dog biscuits fills the air!'
            },
            {
                id: 'petshop_door', x: 28, y: 9, w: 2, h: 1,
                visible: false,
                action: 'dialogue', text: 'Pawsworth\'s Pet Emporium — Toys, treats, and supplies!'
            },
        ],
        lights: [
            { x: 19.5, y: 16.5, radius: 7, color: '255,220,150' },   // town square main
            { x: 7, y: 7, radius: 4.5, color: '255,180,80' },        // bakery warm glow
            { x: 30, y: 7, radius: 4.5, color: '200,220,255' },      // pet shop cool light
            { x: 33, y: 23, radius: 5.5, color: '255,200,100' },     // town hall
            { x: 19.5, y: 10, radius: 3, color: '255,190,90' },      // market street lamp
            { x: 12, y: 16, radius: 3, color: '255,190,90' },        // west street lamp
            { x: 27, y: 16, radius: 3, color: '255,190,90' },        // east street lamp
            { x: 15, y: 25, radius: 3.5, color: '150,255,180' },     // park mako glow
            { x: 25, y: 25, radius: 3.5, color: '150,255,180' },     // park mako glow
            { x: 19.5, y: 3, radius: 4, color: '180,200,255' },      // north gate moonlight
            { x: 5, y: 30, radius: 3, color: '255,160,100' },        // south campfire
            { x: 35, y: 30, radius: 3, color: '255,160,100' },       // south campfire
        ]
    };
})();

// Map registry - also expose on window for cross-script access
const VILLAGE_MAPS = {
    academy: VILLAGE_ACADEMY,
    barksville: VILLAGE_BARKSVILLE,
};
window.VILLAGE_MAPS = VILLAGE_MAPS;
