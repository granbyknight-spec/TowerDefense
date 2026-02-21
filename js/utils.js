// Math and utility helpers

function dist(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function gridToPixel(col, row, tileSize) {
    return {
        x: col * tileSize + tileSize / 2,
        y: row * tileSize + tileSize / 2
    };
}

function pixelToGrid(x, y, tileSize) {
    return {
        col: Math.floor(x / tileSize),
        row: Math.floor(y / tileSize)
    };
}
