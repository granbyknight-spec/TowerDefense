'use strict';
// =============================================================================
// Puppy Force — EnemyAI.js
// Enemy AI decision making: aggressive, defensive, flanker, ranged, boss
// =============================================================================

/**
 * Given an enemy unit and game state, returns { moveTo:{col,row}, target:Unit|null }
 * moveTo is always a valid reachable tile (could be current position).
 */
function computeEnemyAction(unit, mapGrid, allUnits) {
  const players = allUnits.filter(u => !u.dead && u.team === 'player');
  if (players.length === 0) {
    return { moveTo: { col: unit.col, row: unit.row }, target: null };
  }

  switch (unit.ai) {
    case 'aggressive': return _aggressive(unit, mapGrid, allUnits, players);
    case 'flanker':    return _flanker(unit, mapGrid, allUnits, players);
    case 'ranged':     return _ranged(unit, mapGrid, allUnits, players);
    case 'defensive':  return _defensive(unit, mapGrid, allUnits, players);
    case 'boss':       return _boss(unit, mapGrid, allUnits, players);
    default:           return _aggressive(unit, mapGrid, allUnits, players);
  }
}

// Moves toward nearest player and attacks if in range
function _aggressive(unit, mapGrid, allUnits, players) {
  const reachable = getReachableTiles(unit, mapGrid, allUnits);
  const allTiles  = [{ col: unit.col, row: unit.row }, ...reachable];

  // Find best tile that allows attacking a player
  let bestMove = null, bestTarget = null, bestTargetHp = Infinity;

  for (const tile of allTiles) {
    const atkTiles = getAttackTiles(unit, mapGrid, tile.col, tile.row);
    for (const atk of atkTiles) {
      const target = players.find(u => u.col === atk.col && u.row === atk.row);
      if (target) {
        // Prefer weakest target
        if (!bestTarget || target.hp < bestTargetHp) {
          bestMove   = tile;
          bestTarget = target;
          bestTargetHp = target.hp;
        }
      }
    }
  }

  if (bestMove && bestTarget) return { moveTo: bestMove, target: bestTarget };

  // No attack possible: move toward nearest player
  const nearest = _nearestPlayer(unit, players);
  const moveTo  = _moveToward(unit, nearest, reachable);
  return { moveTo, target: null };
}

// ---------------------------------------------------------------------------
// Flanker AI — True flanking: approaches from the sides of the formation
// Targets the lowest-DEF player that is NOT the front-line unit (closest enemy)
// and tries to approach from col < leftmost_player or col > rightmost_player.
function _flanker(unit, mapGrid, allUnits, players) {
  const reachable = getReachableTiles(unit, mapGrid, allUnits);
  const allTiles  = [{ col: unit.col, row: unit.row }, ...reachable];

  // Front-line player = the one closest to this enemy unit (to avoid)
  const frontLine = _nearestPlayer(unit, players);

  // Flank target: lowest DEF player that is not the front-liner
  // Fall back to any player if all are front-liners (single player left)
  const nonFront = players.filter(p => p !== frontLine);
  const flankCandidates = nonFront.length > 0 ? nonFront : players;
  const flankTarget = flankCandidates.reduce((best, p) =>
    (p.def < best.def ? p : best), flankCandidates[0]);

  // Determine flanking column bounds (outside leftmost or rightmost player col)
  const playerCols = players.map(p => p.col);
  const leftCol    = Math.min(...playerCols);
  const rightCol   = Math.max(...playerCols);

  // Score tiles: prefer those that attack flankTarget AND approach from outside cols
  let bestMove = null, bestScore = -Infinity, bestTarget = null;

  for (const tile of allTiles) {
    const atkTiles = getAttackTiles(unit, mapGrid, tile.col, tile.row);
    const hitsFlank = atkTiles.some(a => a.col === flankTarget.col && a.row === flankTarget.row);
    if (!hitsFlank) continue;

    // Score: +2 if approaching from outside formation cols, else 0
    const flanking = (tile.col < leftCol || tile.col > rightCol) ? 2 : 0;
    const score = flanking;
    if (!bestMove || score > bestScore) {
      bestMove   = tile;
      bestTarget = flankTarget;
      bestScore  = score;
    }
  }

  if (bestMove && bestTarget) return { moveTo: bestMove, target: bestTarget };

  // Can't attack flankTarget yet; try any player from a flanking column tile
  for (const tile of allTiles) {
    const atkTiles = getAttackTiles(unit, mapGrid, tile.col, tile.row);
    for (const atk of atkTiles) {
      const target = players.find(u => u.col === atk.col && u.row === atk.row);
      if (target) return { moveTo: tile, target };
    }
  }

  // No attack possible: move toward flank target, preferring outer-column tiles
  const moveTo = _moveTowardFlanking(unit, flankTarget, reachable, leftCol, rightCol);
  return { moveTo, target: null };
}

// ---------------------------------------------------------------------------
// Ranged AI — Kiting: prefer max-range tiles; retreat if possible after attacking
function _ranged(unit, mapGrid, allUnits, players) {
  const reachable = getReachableTiles(unit, mapGrid, allUnits);
  const allTiles  = [{ col: unit.col, row: unit.row }, ...reachable];
  const maxRange  = unit.range || 1;

  let bestMove = null, bestTarget = null, bestDist = -1;

  for (const tile of allTiles) {
    const atkTiles = getAttackTiles(unit, mapGrid, tile.col, tile.row);
    for (const atk of atkTiles) {
      const target = players.find(u => u.col === atk.col && u.row === atk.row);
      if (!target) continue;
      const dist = Math.abs(tile.col - target.col) + Math.abs(tile.row - target.row);
      // Prefer tiles at MAX range first, then by distance desc, then weakest target on tie
      const isBetter = !bestMove
        || dist > bestDist
        || (dist === bestDist && target.hp < bestTarget.hp);
      if (isBetter) {
        bestMove   = tile;
        bestTarget = target;
        bestDist   = dist;
      }
    }
  }

  if (bestMove && bestTarget) {
    // Kiting: if we can move to a tile that is still at max range but farther from
    // all players than the current bestMove, prefer that tile.
    const kiteTile = _findKiteTile(unit, bestTarget, reachable, maxRange, players);
    if (kiteTile) return { moveTo: kiteTile, target: bestTarget };
    return { moveTo: bestMove, target: bestTarget };
  }

  // No attack possible: move AWAY from nearest player to buy time
  const nearest = _nearestPlayer(unit, players);
  const moveTo  = _moveAwayFrom(unit, nearest, reachable);
  return { moveTo, target: null };
}

// ---------------------------------------------------------------------------
// Defensive AI — Formation holding: stay put unless players are within 3 tiles
function _defensive(unit, mapGrid, allUnits, players) {
  const reachable = getReachableTiles(unit, mapGrid, allUnits);

  // Attack if someone is in range right now (from current position)
  const atkTiles = getAttackTiles(unit, mapGrid, unit.col, unit.row);
  for (const atk of atkTiles) {
    const target = players.find(u => u.col === atk.col && u.row === atk.row);
    if (target) return { moveTo: { col: unit.col, row: unit.row }, target };
  }

  // If nearest player is more than 4 tiles away, hold position
  const nearest = _nearestPlayer(unit, players);
  const distToNearest = Math.abs(nearest.col - unit.col) + Math.abs(nearest.row - unit.row);
  if (distToNearest > 4) {
    // Tighten formation: find boss unit and move 1 tile toward it, or stay put
    const boss = allUnits.find(u => !u.dead && u.team === 'enemy' && u.isBoss);
    if (boss) {
      const tightenTile = _moveToward(unit, boss, reachable);
      // Only tighten if it gets us closer to boss (max 1 tile adjustment)
      const curDistBoss = Math.abs(unit.col - boss.col) + Math.abs(unit.row - boss.row);
      const newDistBoss = Math.abs(tightenTile.col - boss.col) + Math.abs(tightenTile.row - boss.row);
      if (newDistBoss < curDistBoss) return { moveTo: tightenTile, target: null };
    }
    return { moveTo: { col: unit.col, row: unit.row }, target: null };
  }

  // Player is within 3 tiles — only advance aggressively at range ≤ 3
  if (distToNearest <= 3) {
    // Bodyguard: prefer tiles between the boss (or spawn point) and nearest player
    const boss = allUnits.find(u => !u.dead && u.team === 'enemy' && u.isBoss);
    const guardTarget = boss || nearest; // anchor point to guard in front of

    const allTiles = [{ col: unit.col, row: unit.row }, ...reachable];
    let bestMove = null, bestTarget = null;

    // Check all reachable tiles for attack opportunities, preferring bodyguard position
    let bestScore = -Infinity;
    for (const tile of allTiles) {
      const tileAtkTiles = getAttackTiles(unit, mapGrid, tile.col, tile.row);
      const canAtk = tileAtkTiles.some(a =>
        players.find(u => u.col === a.col && u.row === a.row)
      );

      // Bodyguard score: prefer tiles that are between boss and nearest player
      const bodyguardScore = boss
        ? _bodyguardScore(tile, boss, nearest)
        : 0;

      if (canAtk) {
        const score = 10 + bodyguardScore;
        if (score > bestScore) {
          // Find the best target from this tile (weakest player)
          let tgt = null, tgtHp = Infinity;
          for (const atk of tileAtkTiles) {
            const t = players.find(u => u.col === atk.col && u.row === atk.row);
            if (t && t.hp < tgtHp) { tgt = t; tgtHp = t.hp; }
          }
          bestMove   = tile;
          bestTarget = tgt;
          bestScore  = score;
        }
      }
    }

    if (bestMove && bestTarget) return { moveTo: bestMove, target: bestTarget };

    // No attack: advance toward nearest player from bodyguard position
    const moveTo = _moveToward(unit, nearest, reachable);
    return { moveTo, target: null };
  }

  // 3 < distToNearest <= 4: hold position
  return { moveTo: { col: unit.col, row: unit.row }, target: null };
}

// ---------------------------------------------------------------------------
// Boss AI — targets highest-ATK player (greatest threat)
function _boss(unit, mapGrid, allUnits, players) {
  const reachable = getReachableTiles(unit, mapGrid, allUnits);
  const allTiles  = [{ col: unit.col, row: unit.row }, ...reachable];

  // Priority: highest ATK first (greatest threat), break ties by lowest HP
  const priority = [...players].sort((a, b) =>
    b.atk !== a.atk ? b.atk - a.atk : a.hp - b.hp
  );

  for (const p of priority) {
    for (const tile of allTiles) {
      const atkTiles = getAttackTiles(unit, mapGrid, tile.col, tile.row);
      if (atkTiles.some(a => a.col === p.col && a.row === p.row)) {
        return { moveTo: tile, target: p };
      }
    }
  }

  // Move toward priority target (highest ATK)
  const moveTo = _moveToward(unit, priority[0], reachable);
  return { moveTo, target: null };
}

// --------------------------------------------------------------------------
// Helpers

function _nearestPlayer(unit, players) {
  return players.reduce((best, p) => {
    const da = Math.abs(unit.col - best.col) + Math.abs(unit.row - best.row);
    const db = Math.abs(unit.col - p.col)    + Math.abs(unit.row - p.row);
    return db < da ? p : best;
  });
}

function _moveToward(unit, target, reachable) {
  if (reachable.length === 0) return { col: unit.col, row: unit.row };
  // Current tile is also a valid option
  const all = [{ col: unit.col, row: unit.row }, ...reachable];
  return all.reduce((best, tile) => {
    const da = Math.abs(best.col - target.col) + Math.abs(best.row - target.row);
    const db = Math.abs(tile.col - target.col) + Math.abs(tile.row - target.row);
    return db < da ? tile : best;
  });
}

// Move AWAY from a target — find reachable tile that maximizes distance
function _moveAwayFrom(unit, target, reachable) {
  if (reachable.length === 0) return { col: unit.col, row: unit.row };
  const all = [{ col: unit.col, row: unit.row }, ...reachable];
  return all.reduce((best, tile) => {
    const da = Math.abs(best.col - target.col) + Math.abs(best.row - target.row);
    const db = Math.abs(tile.col - target.col) + Math.abs(tile.row - target.row);
    return db > da ? tile : best;
  });
}

// Kiting helper: find a reachable tile that can still attack `target` at exactly
// maxRange distance AND is farther from ALL players than the current position.
// Returns null if no such tile exists (caller falls back to bestMove).
function _findKiteTile(unit, target, reachable, maxRange, players) {
  const curDist = _totalDistToPlayers(unit.col, unit.row, players);
  let kiteTile = null, kiteDist = curDist;

  for (const tile of reachable) {
    const distToTarget = Math.abs(tile.col - target.col) + Math.abs(tile.row - target.row);
    if (distToTarget !== maxRange) continue; // must stay at max range of chosen target
    const totalDist = _totalDistToPlayers(tile.col, tile.row, players);
    if (totalDist > kiteDist) {
      kiteDist = totalDist;
      kiteTile = tile;
    }
  }
  return kiteTile;
}

function _totalDistToPlayers(col, row, players) {
  return players.reduce((sum, p) =>
    sum + Math.abs(col - p.col) + Math.abs(row - p.row), 0);
}

// Move toward target preferring tiles outside formation column bounds
function _moveTowardFlanking(unit, target, reachable, leftCol, rightCol) {
  if (reachable.length === 0) return { col: unit.col, row: unit.row };
  const all = [{ col: unit.col, row: unit.row }, ...reachable];
  return all.reduce((best, tile) => {
    const distA = Math.abs(best.col - target.col) + Math.abs(best.row - target.row);
    const distB = Math.abs(tile.col - target.col) + Math.abs(tile.row - target.row);
    const flankA = (best.col < leftCol || best.col > rightCol) ? 1 : 0;
    const flankB = (tile.col < leftCol || tile.col > rightCol) ? 1 : 0;
    // Primary: flanking bonus; secondary: closeness to target
    if (flankB !== flankA) return flankB > flankA ? tile : best;
    return distB < distA ? tile : best;
  });
}

// Bodyguard score: higher when the tile is between the boss and the nearest player
// Uses dot-product approach: positive when tile is "in front of" boss toward player
function _bodyguardScore(tile, boss, player) {
  // Vector from boss to player
  const bpCol = player.col - boss.col;
  const bpRow = player.row - boss.row;
  // Vector from boss to tile
  const btCol = tile.col - boss.col;
  const btRow = tile.row - boss.row;
  // Dot product: positive = tile is on the boss→player side
  return bpCol * btCol + bpRow * btRow;
}
