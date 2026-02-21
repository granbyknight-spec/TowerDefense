// A* Pathfinding on the grid
// Returns array of {col, row} from start to end, or null if no path

function findPath(grid, start, end, cols, rows) {
    const key = (col, row) => col + ',' + row;
    const openSet = [];
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    const startKey = key(start.col, start.row);
    const endKey = key(end.col, end.row);

    gScore[startKey] = 0;
    fScore[startKey] = heuristic(start, end);
    openSet.push({ col: start.col, row: start.row, f: fScore[startKey] });

    while (openSet.length > 0) {
        // Get node with lowest fScore
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();
        const currentKey = key(current.col, current.row);

        if (currentKey === endKey) {
            return reconstructPath(cameFrom, current);
        }

        // Check 4 neighbors (no diagonals)
        const neighbors = [
            { col: current.col - 1, row: current.row },
            { col: current.col + 1, row: current.row },
            { col: current.col, row: current.row - 1 },
            { col: current.col, row: current.row + 1 }
        ];

        for (const neighbor of neighbors) {
            if (neighbor.col < 0 || neighbor.col >= cols ||
                neighbor.row < 0 || neighbor.row >= rows) continue;

            // Can't walk through towers (grid value 1 = tower)
            if (grid[neighbor.row][neighbor.col] === 1) continue;

            const neighborKey = key(neighbor.col, neighbor.row);
            const tentativeG = gScore[currentKey] + 1;

            if (tentativeG < (gScore[neighborKey] ?? Infinity)) {
                cameFrom[neighborKey] = current;
                gScore[neighborKey] = tentativeG;
                fScore[neighborKey] = tentativeG + heuristic(neighbor, end);
                neighbor.f = fScore[neighborKey];

                if (!openSet.some(n => key(n.col, n.row) === neighborKey)) {
                    openSet.push(neighbor);
                }
            }
        }
    }

    return null; // No path found
}

function heuristic(a, b) {
    // Manhattan distance
    return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

function reconstructPath(cameFrom, current) {
    const path = [{ col: current.col, row: current.row }];
    let k = current.col + ',' + current.row;
    while (cameFrom[k]) {
        current = cameFrom[k];
        path.unshift({ col: current.col, row: current.row });
        k = current.col + ',' + current.row;
    }
    return path;
}

// Check if placing a tower at (col, row) would block the path
function wouldBlockPath(grid, col, row, cols, rows, entry, exit) {
    // Temporarily place the tower
    const oldVal = grid[row][col];
    grid[row][col] = 1;

    const path = findPath(grid, entry, exit, cols, rows);

    // Restore
    grid[row][col] = oldVal;

    return path === null;
}
