/**
 * Map Component
 * Renders the game map with walls, blocks, players, bombs, power-ups and explosions
 * Optimized for performance with CSS classes
 */
import { createElement } from '../../../src/index.js';
import Player from './Player.js';

// Map cell types constants
const EMPTY = 0;
const BLOCK = 1;  // Destructible
const WALL = 2;   // Indestructible

// Cache for static map elements
let staticMapCache = null;
let lastMapHash = null;

/**
 * Generate a hash of the map grid to detect changes
 * @param {Object} map - Map object with grid
 * @returns {string} Hash string representing the map state
 */
function getMapHash(map) {
    if (!map || !map.grid) return '';
    // Simple hash - stringify the grid
    return JSON.stringify(map.grid);
}

/**
 * Map Component
 * @param {Object} props - Component props
 * @returns {Object} Virtual DOM element
 */
function Map(props) {
    const { map, players, bombs, powerUps, explosions, yourId } = props;

    if (!map || !map.grid) {
        return createElement('div', { class: 'map-error' }, [
            'Error loading map data'
        ]);
    }

    // Calculate cell size based on map dimensions
    const cellSize = 40; // 40px per cell

    // Check if we can use cached static map
    const currentMapHash = getMapHash(map);
    let mapCells = [];

    // Only rebuild static map if it changed (blocks destroyed)
    if (currentMapHash !== lastMapHash || !staticMapCache) {
        // Create map grid cells
        mapCells = [];

        // Add cells for each row and column
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const cellValue = map.grid[y][x];
                let cellClass = '';

                switch (cellValue) {
                    case EMPTY:
                        cellClass = 'empty';
                        break;
                    case BLOCK:
                        cellClass = 'block';
                        break;
                    case WALL:
                        cellClass = 'wall';
                        break;
                }

                // Create the cell with data attributes for faster lookups
                mapCells.push(createElement('div', {
                    class: `map-cell ${cellClass}`,
                    key: `cell-${x}-${y}`,
                    'data-x': x,
                    'data-y': y,
                    'data-type': cellValue,
                    style: {
                        top: `${y * cellSize}px`,
                        left: `${x * cellSize}px`
                    }
                }));
            }
        }

        // Update cache
        staticMapCache = mapCells;
        lastMapHash = currentMapHash;
    } else {
        // Use cached map cells
        mapCells = staticMapCache;
    }

    // Create explosion cells with data attributes for tracking
    const explosionCells = explosions.map(explosion =>
        explosion.cells.map(cell =>
            createElement('div', {
                class: 'explosion',
                key: `explosion-${explosion.id}-${cell.x}-${cell.y}`,
                'data-explosion-id': explosion.id,
                'data-cell-x': cell.x,
                'data-cell-y': cell.y,
                style: {
                    top: `${cell.y * cellSize}px`,
                    left: `${cell.x * cellSize}px`
                }
            })
        )
    ).flat(); // Flatten the array of arrays

    // Create bomb elements with data attributes
    const bombElements = bombs.map(bomb => {
        const timeLeft = 2000 - (Date.now() - bomb.placedAt);
        const isAboutToExplode = timeLeft < 500;

        return createElement('div', {
            class: `bomb ${isAboutToExplode ? 'about-to-explode' : ''}`,
            key: `bomb-${bomb.id}`,
            'data-bomb-id': bomb.id,
            'data-cell-x': bomb.x,
            'data-cell-y': bomb.y,
            style: {
                top: `${bomb.y * cellSize}px`,
                left: `${bomb.x * cellSize}px`
            }
        });
    });

    // Create power-up elements with data attributes for faster lookup
    const powerUpElements = powerUps.map(powerUp =>
        createElement('div', {
            class: `power-up ${powerUp.type}`,
            key: `powerup-${powerUp.id}`,
            'data-powerup-id': powerUp.id,
            'data-type': powerUp.type,
            'data-cell-x': powerUp.x,
            'data-cell-y': powerUp.y,
            style: {
                top: `${powerUp.y * cellSize}px`,
                left: `${powerUp.x * cellSize}px`
            },
            'aria-label': `${powerUp.type} power-up`
        })
    );

    // Create player elements with optimized rendering
    const playerElements = players
        .filter(player => player.lives > 0) // Only render alive players
        .map(player => {
            // Get player sprite based on ID
            const playerNum = parseInt(player.id.replace(/\D/g, '')) % 6 + 1;
            const displayName = player.id === yourId ? 'You' : (player.nickname || `Player ${playerNum}`);

            return createElement('div', {
                class: `player ${player.id === yourId ? 'current-player' : ''}`,
                key: `player-${player.id}`,
                'data-player-id': player.id,
                style: {
                    top: `${player.position.y * cellSize}px`,
                    left: `${player.position.x * cellSize}px`,
                    backgroundImage: `url("/assets/images/players/player${playerNum}.png")`
                },
                'aria-label': displayName
            }, [
                // Player name tag
                createElement('div', {
                    class: `player-name ${player.id === yourId ? 'current-player' : ''}`,
                }, [displayName])
            ]);
        });

    // After render function for optimization
    const afterRenderHook = () => {
        // If browser supports IntersectionObserver, use it to optimize rendering
        if ('IntersectionObserver' in window) {
            // This would be implemented in a production version
            // to only render elements that are visible on screen
        }

        // Optimize animations for bombs that are about to explode
        const bombEls = document.querySelectorAll('.bomb');
        bombEls.forEach(bombEl => {
            const bombId = bombEl.getAttribute('data-bomb-id');
            const bomb = bombs.find(b => b.id === bombId);

            if (bomb) {
                const timeLeft = 2000 - (Date.now() - bomb.placedAt);
                if (timeLeft < 500 && !bombEl.classList.contains('about-to-explode')) {
                    bombEl.classList.add('about-to-explode');
                }
            }
        });
    };

    // Run the afterRenderHook with a slight delay to ensure DOM is ready
    setTimeout(afterRenderHook, 0);

    return createElement('div', {
        class: 'game-map',
        style: {
            width: `${map.width * cellSize}px`,
            height: `${map.height * cellSize}px`
        }
    }, [
        // Map cells (walls and blocks)
        ...mapCells,

        // Explosions
        ...explosionCells,

        // Bombs
        ...bombElements,

        // Power-ups
        ...powerUpElements,

        // Players
        ...playerElements
    ]);
}

export default Map;