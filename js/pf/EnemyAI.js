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

// Tries to attack from a flanking position (prefer side/behind)
function _flanker(unit, mapGrid, allUnits, players) {
  // For simplicity, flanker acts like aggressive but targets the weakest player
  const players_sorted = [...players].sort((a,b) => a.hp - b.hp);
  const reachable = getReachableTiles(unit, mapGrid, allUnits);
  const allTiles  = [{ col: unit.col, row: unit.row }, ...reachable];

  for (const p of players_sorted) {
    for (const tile of allTiles) {
      const atkTiles = getAttackTiles(unit, mapGrid, tile.col, tile.row);
      if (atkTiles.some(a => a.col === p.col && a.row === p.row)) {
        return { moveTo: tile, target: p };
      }
    }
  }

  const nearest = players_sorted[0];
  const moveTo  = _moveToward(unit, nearest, reachable);
  return { moveTo, target: null };
}

// Stays at range, shoots if possible
function _ranged(unit, mapGrid, allUnits, players) {
  const reachable = getReachableTiles(unit, mapGrid, allUnits);
  const allTiles  = [{ col: unit.col, row: unit.row }, ...reachable];

  let bestMove = null, bestTarget = null, bestDist = -1;

  // Prefer tiles that are at range=2 from a player (safe range), then weakest target
  for (const tile of allTiles) {
    const atkTiles = getAttackTiles(unit, mapGrid, tile.col, tile.row);
    for (const atk of atkTiles) {
      const target = players.find(u => u.col === atk.col && u.row === atk.row);
      if (target) {
        const dist = Math.abs(tile.col - target.col) + Math.abs(tile.row - target.row);
        // Prefer max-range attack (safest); on tie prefer weakest target
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
  }

  if (bestMove && bestTarget) return { moveTo: bestMove, target: bestTarget };

  // Move toward nearest but try to stay 1 tile away
  const nearest = _nearestPlayer(unit, players);
  let moveTo = _moveToward(unit, nearest, reachable);
  return { moveTo, target: null };
}

// Stays put unless player gets close
function _defensive(unit, mapGrid, allUnits, players) {
  const reachable = getReachableTiles(unit, mapGrid, allUnits);
  const allTiles  = [{ col: unit.col, row: unit.row }, ...reachable];

  // Attack if someone is in range right now
  const atkTiles = getAttackTiles(unit, mapGrid, unit.col, unit.row);
  for (const atk of atkTiles) {
    const target = players.find(u => u.col === atk.col && u.row === atk.row);
    if (target) return { moveTo: { col: unit.col, row: unit.row }, target };
  }

  // Check if any player is within 3 tiles (aggro range)
  const inRange = players.filter(p =>
    Math.abs(p.col - unit.col) + Math.abs(p.row - unit.row) <= 3
  );
  if (inRange.length === 0) return { moveTo: { col: unit.col, row: unit.row }, target: null };

  // Pursue attacker
  return _aggressive(unit, mapGrid, allUnits, inRange.length ? inRange : players);
}

// Boss: charges hardest (most advanced) player unit
function _boss(unit, mapGrid, allUnits, players) {
  const reachable = getReachableTiles(unit, mapGrid, allUnits);
  const allTiles  = [{ col: unit.col, row: unit.row }, ...reachable];

  // Target unit with highest ATK (the biggest threat)
  const priority = [...players].sort((a,b) => b.atk - a.atk);

  let bestMove = null, bestTarget = null;
  for (const p of priority) {
    for (const tile of allTiles) {
      const atkTiles = getAttackTiles(unit, mapGrid, tile.col, tile.row);
      if (atkTiles.some(a => a.col === p.col && a.row === p.row)) {
        return { moveTo: tile, target: p };
      }
    }
  }

  // Move toward priority target
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
  // Stay on current tile is also valid
  const all = [{ col: unit.col, row: unit.row }, ...reachable];
  return all.reduce((best, tile) => {
    const da = Math.abs(best.col - target.col) + Math.abs(best.row - target.row);
    const db = Math.abs(tile.col - target.col) + Math.abs(tile.row - target.row);
    return db < da ? tile : best;
  });
}
