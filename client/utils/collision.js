/**
 * Collision Utilities
 * Handles collision detection for game objects
 */
import { CELL_TYPES } from './constants.js';

/**
 * Check if a position is within map boundaries
 * @param {Object} map - Game map object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if position is within boundaries
 */
export function isWithinBoundaries(map, x, y) {
    return x >= 0 && x < map.width && y >= 0 && y < map.height;
}

/**
 * Check if a position contains a wall
 * @param {Object} map - Game map object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if position contains a wall
 */
export function isWall(map, x, y) {
    // Check boundaries
    if (!isWithinBoundaries(map, x, y)) {
        return true; // Consider out-of-bounds as walls
    }

    // Check if cell is a wall (value 2)
    return map.grid[y][x] === CELL_TYPES.WALL;
}

/**
 * Check if a position contains a destructible block
 * @param {Object} map - Game map object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if position contains a block
 */
export function isBlock(map, x, y) {
    // Check boundaries
    if (!isWithinBoundaries(map, x, y)) {
        return false;
    }

    // Check if cell is a block (value 1)
    return map.grid[y][x] === CELL_TYPES.BLOCK;
}

/**
 * Check if a position is empty (no wall or block)
 * @param {Object} map - Game map object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if position is empty
 */
export function isEmpty(map, x, y) {
    // Check boundaries
    if (!isWithinBoundaries(map, x, y)) {
        return false;
    }

    // Check if cell is empty (value 0)
    return map.grid[y][x] === CELL_TYPES.EMPTY;
}

/**
 * Check if a position has a bomb
 * @param {Array} bombs - Array of bomb objects
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if position has a bomb
 */
export function hasBomb(bombs, x, y) {
    return bombs.some(bomb => bomb.x === x && bomb.y === y);
}

/**
 * Check if a position has a power-up
 * @param {Array} powerUps - Array of power-up objects
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {Object|null} Power-up object if found, null otherwise
 */
export function getPowerUp(powerUps, x, y) {
    return powerUps.find(powerUp => powerUp.x === x && powerUp.y === y) || null;
}

/**
 * Check if a position is in explosion range
 * @param {Array} explosions - Array of explosion objects
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if position is in explosion range
 */
export function isInExplosion(explosions, x, y) {
    return explosions.some(explosion =>
        explosion.cells.some(cell => cell.x === x && cell.y === y)
    );
}

/**
 * Calculate explosion cells based on bomb position and range
 * @param {Object} map - Game map object
 * @param {number} x - Bomb X coordinate
 * @param {number} y - Bomb Y coordinate
 * @param {number} range - Explosion range
 * @returns {Array} Array of cell coordinates affected by explosion
 */
export function calculateExplosionCells(map, x, y, range) {
    const cells = [{ x, y }]; // Center of explosion

    // Directions: up, right, down, left
    const directions = [
        { dx: 0, dy: -1 }, // Up
        { dx: 1, dy: 0 },  // Right
        { dx: 0, dy: 1 },  // Down
        { dx: -1, dy: 0 }  // Left
    ];

    // Check each direction
    directions.forEach(dir => {
        for (let i = 1; i <= range; i++) {
            const newX = x + (dir.dx * i);
            const newY = y + (dir.dy * i);

            // Stop if we hit a wall
            if (isWall(map, newX, newY)) {
                break;
            }

            // Add explosion cell
            cells.push({ x: newX, y: newY });

            // Stop at a block (but include it in explosion)
            if (isBlock(map, newX, newY)) {
                break;
            }
        }
    });

    return cells;
}

/**
 * Check if a player would collide with walls, blocks, or bombs when moving
 * @param {Object} map - Game map object
 * @param {Array} bombs - Array of bomb objects
 * @param {number} x - Destination X coordinate
 * @param {number} y - Destination Y coordinate
 * @param {boolean} canPassBombs - Whether the player can pass through bombs
 * @param {boolean} canPassBlocks - Whether the player can pass through blocks
 * @returns {boolean} True if position is valid for movement
 */
export function canMoveTo(map, bombs, x, y, canPassBombs = false, canPassBlocks = false) {
    // Check for walls (always blocked)
    if (isWall(map, x, y)) {
        return false;
    }

    // Check for blocks (if can't pass through)
    if (!canPassBlocks && isBlock(map, x, y)) {
        return false;
    }

    // Check for bombs (if can't pass through)
    if (!canPassBombs && hasBomb(bombs, x, y)) {
        return false;
    }

    // Position is valid for movement
    return true;
}

/**
 * Get all players at a specific position
 * @param {Array} players - Array of player objects
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {Array} Array of players at the position
 */
export function getPlayersAt(players, x, y) {
    return players.filter(player =>
        player.lives > 0 &&
        player.position.x === x &&
        player.position.y === y
    );
}

export default {
    isWithinBoundaries,
    isWall,
    isBlock,
    isEmpty,
    hasBomb,
    getPowerUp,
    isInExplosion,
    calculateExplosionCells,
    canMoveTo,
    getPlayersAt
};