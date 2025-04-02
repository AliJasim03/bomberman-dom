/**
 * Map Generator
 * Generates game maps with walls and blocks
 *
 * Map cell values:
 * 0 = empty
 * 1 = destructible block
 * 2 = indestructible wall
 */

/**
 * Generate a map for the game
 * @param {number} playerCount - Number of players (2-4)
 * @returns {Object} Map object with grid, width, and height
 */
function generateMap(playerCount) {
    // Default map size: 15x13 (adjust based on your game needs)
    const width = 15;
    const height = 13;

    // Create empty grid
    const grid = Array(height).fill().map(() => Array(width).fill(0));

    // Add indestructible walls (border and checkerboard pattern)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Border walls
            if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
                grid[y][x] = 2;
                continue;
            }

            // Checkerboard pattern of indestructible walls
            if (x % 2 === 0 && y % 2 === 0) {
                grid[y][x] = 2;
            }
        }
    }

    // Add destructible blocks randomly, but leave player starting areas clear
    const cornerAreas = [
        // Top-left (player 1)
        { x: 1, y: 1, width: 2, height: 2 },
        // Bottom-right (player 2)
        { x: width - 3, y: height - 3, width: 2, height: 2 }
    ];

    if (playerCount >= 3) {
        // Top-right (player 3)
        cornerAreas.push({ x: width - 3, y: 1, width: 2, height: 2 });
    }

    if (playerCount >= 4) {
        // Bottom-left (player 4)
        cornerAreas.push({ x: 1, y: height - 3, width: 2, height: 2 });
    }

    // Add destructible blocks with 40% probability
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            // Skip indestructible walls
            if (grid[y][x] === 2) continue;

            // Skip player starting areas
            const inStartArea = cornerAreas.some(area => {
                return x >= area.x && x < area.x + area.width &&
                    y >= area.y && y < area.y + area.height;
            });

            if (inStartArea) continue;

            // 40% chance to place a destructible block
            if (Math.random() < 0.4) {
                grid[y][x] = 1;
            }
        }
    }

    return {
        grid,
        width,
        height
    };
}

module.exports = {
    generateMap
};