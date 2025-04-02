/**
 * Map Component
 * Renders the game map with players, bombs, powerups and explosions
 */
import { createElement } from '../../../src/index.js';
import Player from './Player.js';
import PowerUp from './PowerUp.js';

/**
 * Map Component
 * @param {Object} props - Component props
 * @param {Object} props.map - Map data with grid and dimensions
 * @param {Array} props.players - Array of player objects
 * @param {Array} props.bombs - Array of bomb objects
 * @param {Array} props.powerUps - Array of power-up objects
 * @param {Array} props.explosions - Array of explosion objects
 * @param {string} props.yourId - Current player's ID
 * @returns {Object} Virtual DOM element
 */
function Map(props) {
    const { map, players, bombs, powerUps, explosions, yourId } = props;

    if (!map || !map.grid) {
        return createElement('div', { class: 'map-error' }, [
            'Error loading map data'
        ]);
    }

    // Map cell types
    const EMPTY = 0;
    const BLOCK = 1;
    const WALL = 2;

    // Calculate cell size based on map dimensions
    // We want to ensure the map fits well on most screens
    const cellSize = 32; // 32px per cell

    // Create map grid cells
    const mapCells = [];

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

            // Create the cell
            mapCells.push(createElement('div', {
                class: `map-cell ${cellClass}`,
                key: `cell-${x}-${y}`,
                style: {
                    top: `${y * cellSize}px`,
                    left: `${x * cellSize}px`,
                }
            }));
        }
    }

    // Create explosion cells
    const explosionCells = [];

    explosions.forEach(explosion => {
        explosion.cells.forEach(cell => {
            explosionCells.push(createElement('div', {
                class: 'explosion',
                key: `explosion-${explosion.id}-${cell.x}-${cell.y}`,
                style: {
                    top: `${cell.y * cellSize}px`,
                    left: `${cell.x * cellSize}px`
                }
            }));
        });
    });

    // Create bomb elements
    const bombElements = bombs.map(bomb =>
        createElement('div', {
            class: 'bomb',
            key: `bomb-${bomb.id}`,
            style: {
                top: `${bomb.y * cellSize}px`,
                left: `${bomb.x * cellSize}px`
            }
        })
    );

    // Create power-up elements
    const powerUpElements = powerUps.map(powerUp =>
        createElement(PowerUp, {
            key: `powerup-${powerUp.id}`,
            type: powerUp.type,
            x: powerUp.x,
            y: powerUp.y,
            cellSize
        })
    );

    // Create player elements
    const playerElements = players.map(player =>
        createElement(Player, {
            key: `player-${player.id}`,
            player,
            isCurrentPlayer: player.id === yourId,
            cellSize
        })
    );

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