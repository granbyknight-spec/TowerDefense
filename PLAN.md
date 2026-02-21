# Puppy Defender - Tower Defense Game

## Tech Stack
- **Vanilla HTML5 + CSS + JavaScript** with Canvas API
- Zero dependencies, all in a single folder
- Mobile-first responsive design with touch controls

## Game Concept
**Puppy Defender** - An open-map tower defense where you place dog towers to stop waves of cats from crossing the yard. The map is fully open - there's no predefined path. Cats use A* pathfinding to navigate from entry to exit, and players must strategically place towers to create mazes that force cats through long, winding gauntlets. If towers completely block the path, placement is rejected.

---

## Architecture

```
index.html          - Entry point, canvas + UI overlay
css/
  style.css         - Mobile-first layout, UI styling
js/
  game.js           - Main game loop, state management
  config.js         - Game constants and balance values
  grid.js           - Map grid, tower placement validation
  pathfinding.js    - A* pathfinding for enemies
  tower.js          - Tower types, targeting, shooting
  enemy.js          - Enemy types, movement, health
  projectile.js     - Projectile logic
  wave.js           - Wave spawning system
  renderer.js       - Canvas drawing (map, towers, enemies, effects)
  ui.js             - HUD, tower selection, touch/click handlers
  utils.js          - Math helpers (distance, lerp, etc.)
```

## Theme: Dogs vs Cats

### Towers (Dog Towers - 3 types)
| Tower | Name | Cost | Range | Damage | Speed | Special |
|-------|------|------|-------|--------|-------|---------|
| 🐕 | **Barker** | 50g | Medium | Low | Fast | Single target bark projectile |
| 🐶 | **Big Boi** | 100g | Short | High | Slow | Splash damage (loud WOOF AoE) |
| 🐩 | **Poodle** | 75g | Medium | Very Low | Medium | Slows enemies (fancy prance intimidation) |

- Towers can be upgraded once (cost = base cost, stats +50%)
- Towers can be sold for 50% of total investment
- Visual: Dog emoji/icons sitting on tiles, animated when attacking

### Enemies (Cat Enemies - 3 types)
| Enemy | Name | HP | Speed | Gold | Special |
|-------|------|-----|-------|------|---------|
| 🐱 | **Kitten** | Low | Fast | 10g | Quick little runner |
| 🐈 | **Tabby** | Medium | Normal | 20g | Standard cat |
| 🐈‍⬛ | **Fat Cat** | High | Slow | 50g | Armored (thicc fur, reduced damage) |

### Open Map & Pathfinding
- **Fully open grid** (e.g., 12x18 for portrait mobile)
- Entry point on left edge, exit on right edge
- Cats use **A* pathfinding** to find shortest route
- **Path recalculates** every time a tower is placed or sold
- **Placement validation**: Cannot place a tower if it would completely block all paths
- **Mazing is the core strategy**: Force cats through long winding corridors of towers
- Visual: Green grass tiles, tower tiles show dog houses

### Wave System
- 20 waves, escalating difficulty
- Each wave: increasing enemy count and tougher compositions
- Short break between waves (with "Send Early" button for bonus gold)
- Final wave: massive Fat Cat swarm
- Cats spawn at entry, pathfind to exit

### Economy
- Start with 200 gold, 20 lives
- Earn gold from kills + small passive income per wave
- Lose 1 life per cat that reaches the exit
- Game over at 0 lives, victory after wave 20

### Visual Style
- Bright, playful colors - green grass yard
- Dogs drawn as cute circle characters with ears, sitting on tiles
- Cats drawn as circle characters with pointy ears, walking along path
- Projectiles: small bones (Barker), shockwave ring (Big Boi), sparkles (Poodle)
- HP bars above enemies
- Particle poof on enemy defeat
- Path preview line showing current cat route

### Mobile UX
- Portrait orientation, full-screen canvas
- Tap to select tower type from bottom bar (shows dog icons + cost)
- Tap grid tile to place tower (with path validity check)
- Tap existing tower for upgrade/sell popup
- Wave info + gold/lives at top
- Current path overlay so player can see the maze effect

### Game States
1. **Title Screen**: "Puppy Defender" with play button
2. **Planning Phase**: Place/upgrade/sell towers between waves
3. **Combat Phase**: Cats spawn and march, dogs bark automatically
4. **Victory**: "You defended the yard!" after wave 20
5. **Game Over**: "The cats got through!" at 0 lives

---

## Implementation Order

### Phase 1: Foundation
1. HTML/CSS scaffold with responsive canvas
2. Game loop (requestAnimationFrame) with delta time
3. Grid system and map rendering (grass tiles)
4. A* pathfinding with path visualization

### Phase 2: Core Gameplay
5. Enemy spawning and pathfinding movement
6. Tower placement with path-blocking validation
7. Tower targeting and shooting (projectiles)
8. Damage, HP bars, and enemy death
9. Gold system (earn from kills, spend on towers)

### Phase 3: Full Game
10. Wave system with escalating difficulty
11. All 3 tower types with distinct behaviors (splash, slow)
12. All 3 enemy types
13. Tower upgrades and selling
14. Lives system and win/lose conditions

### Phase 4: Polish
15. UI overlay: tower selection bar, wave counter, gold/lives display
16. Start screen and game over/victory screens
17. Visual polish: dog/cat drawings, particles, animations
18. Mobile touch optimization
