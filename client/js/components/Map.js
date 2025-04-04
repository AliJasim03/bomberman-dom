/**
 * Map Component
 * Renders the game map with walls, blocks, players, bombs, power-ups and explosions
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
    const BLOCK = 1;  // Destructible
    const WALL = 2;   // Indestructible

    // Calculate cell size based on map dimensions
    // We want to ensure the map fits well on most screens
    const cellSize = 40; // 40px per cell

    // Create map grid cells
    const mapCells = [];

    // Add cells for each row and column
    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            const cellValue = map.grid[y][x];
            let cellClass = '';
            let backgroundImage = '';

            switch (cellValue) {
                case EMPTY:
                    cellClass = 'empty';
                    backgroundImage = 'url("/assets/images/map/floor.png")';
                    break;
                case BLOCK:
                    cellClass = 'block';
                    backgroundImage = 'url("/assets/images/map/block.png")';
                    break;
                case WALL:
                    cellClass = 'wall';
                    backgroundImage = 'url("/assets/images/map/wall.png")';
                    break;
            }

            // Create the cell
            mapCells.push(createElement('div', {
                class: `map-cell ${cellClass}`,
                key: `cell-${x}-${y}`,
                style: {
                    top: `${y * cellSize}px`,
                    left: `${x * cellSize}px`,
                    backgroundImage,
                    width: `${cellSize}px`,
                    height: `${cellSize}px`
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
                    left: `${cell.x * cellSize}px`,
                    backgroundImage: 'url("/assets/images/bombs/explosion.png")',
                    width: `${cellSize}px`,
                    height: `${cellSize}px`
                }
            }));
        });
    });

    // Create bomb elements
    const bombElements = bombs.map(bomb => {
        console.log(`Creating bomb at x:${bomb.x}, y:${bomb.y}`); // Add this debug line
        return createElement('div', {
            class: 'bomb',
            key: `bomb-${bomb.id}`,
            style: {
                position: 'absolute',
                top: `${bomb.y * cellSize}px`,
                left: `${bomb.x * cellSize}px`,
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                backgroundImage: 'url("/assets/images/bombs/bomb.png")',
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: 15, // Above floor, below players
                animation: 'pulse 0.5s infinite alternate'
            }
        });
    });

    // Create power-up elements
    const powerUpElements = powerUps.map(powerUp =>
        PowerUp({
            key: `powerup-${powerUp.id}`,
            type: powerUp.type,
            x: powerUp.x,
            y: powerUp.y,
            cellSize
        })
    );

    // Create player elements
    const playerElements = players.map(player =>
        Player({
            key: `player-${player.id}`,
            player,
            isCurrentPlayer: player.id === yourId,
            cellSize
        })
    );

    // Helper function to create sound effects
    const createSoundElement = (src) => {
        return createElement('audio', {
            src,
            preload: 'auto',
            controls: false,
            style: { display: 'none' }
        });
    };

    return createElement('div', {
        class: 'game-map',
        style: {
            width: `${map.width * cellSize}px`,
            height: `${map.height * cellSize}px`,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#3c5063', // Dark blue-gray background
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
            borderRadius: '8px'
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
        ...playerElements,

        // Audio elements
        createSoundElement('/assets/audio/bomb_place.wav'),
        createSoundElement('/assets/audio/explosion.wav'),
        createSoundElement('/assets/audio/powerup.wav'),
        createSoundElement('/assets/audio/player_hit.wav')
    ]);
}

export default Map;