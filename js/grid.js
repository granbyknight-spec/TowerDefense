// Grid management - open map with tower placement and obstacles

class Grid {
    constructor(levelIdx) {
        this.cols = CONFIG.GRID_COLS;
        this.rows = CONFIG.GRID_ROWS;
        this.entry = { ...CONFIG.ENTRY };
        this.exit = { ...CONFIG.EXIT };
        this.cells = [];
        this.currentPath = null;
        this.init(levelIdx || 0);
    }

    init(levelIdx) {
        // 0=empty, 1=tower, 2=water, 3=rock, 4=tree, 5=bridge
        this.cells = [];
        for (let r = 0; r < this.rows; r++) {
            this.cells[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.cells[r][c] = 0;
            }
        }

        // Load map obstacles for this level
        const layout = CONFIG.MAP_LAYOUTS[levelIdx];
        if (layout && layout.obstacles) {
            for (const obs of layout.obstacles) {
                if (obs.row >= 0 && obs.row < this.rows && obs.col >= 0 && obs.col < this.cols) {
                    this.cells[obs.row][obs.col] = obs.type;
                }
            }
        }

        this.recalcPath();
    }

    recalcPath() {
        this.currentPath = findPath(
            this.cells, this.entry, this.exit,
            this.cols, this.rows
        );
        return this.currentPath;
    }

    canPlace(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        // Only empty cells (type 0) are buildable
        if (this.cells[row][col] !== 0) return false;
        if (col === this.entry.col && row === this.entry.row) return false;
        if (col === this.exit.col && row === this.exit.row) return false;
        if (wouldBlockPath(this.cells, col, row, this.cols, this.rows, this.entry, this.exit)) {
            return false;
        }
        return true;
    }

    placeTower(col, row) {
        this.cells[row][col] = 1;
        this.recalcPath();
    }

    removeTower(col, row) {
        this.cells[row][col] = 0;
        this.recalcPath();
    }

    getCellType(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return -1;
        return this.cells[row][col];
    }
}
