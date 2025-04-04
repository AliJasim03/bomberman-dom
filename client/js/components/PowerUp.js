/**
 * PowerUp Component
 * Renders a power-up on the game map
 */
import { createElement } from '../../../src/index.js';

/**
 * Get power-up image path based on type
 * @param {string} type - Power-up type ('bomb', 'flame', 'speed')
 * @returns {string} Path to power-up image
 */
function getPowerUpImage(type) {
    switch (type) {
        case 'bomb':
            return '/assets/images/powerups/bomb_powerup.png';
        case 'flame':
            return '/assets/images/powerups/flame_powerup.png';
        case 'speed':
            return '/assets/images/powerups/speed_powerup.png';
        default:
            return '/assets/images/powerups/bomb_powerup.png'; // Default fallback
    }
}

/**
 * Get the description of a power-up
 * @param {string} type - Power-up type
 * @returns {string} Description of what the power-up does
 */
function getPowerUpDescription(type) {
    switch (type) {
        case 'bomb':
            return 'Increases bomb count';
        case 'flame':
            return 'Increases explosion range';
        case 'speed':
            return 'Increases movement speed';
        default:
            return 'Mystery power-up';
    }
}

/**
 * PowerUp Component
 * @param {Object} props - Component props
 * @param {string} props.type - Power-up type
 * @param {number} props.x - X coordinate on map grid
 * @param {number} props.y - Y coordinate on map grid
 * @param {number} props.cellSize - Size of map cells in pixels
 * @returns {Object} Virtual DOM element
 */
function PowerUp(props) {
    const { type, x, y, cellSize } = props;

    // Calculate pixel position
    const pixelX = x * cellSize;
    const pixelY = y * cellSize;

    // Get power-up image
    const powerUpImage = getPowerUpImage(type);

    return createElement('div', {
        class: `power-up ${type}`,
        style: {
            position: 'absolute',
            top: `${pixelY}px`,
            left: `${pixelX}px`,
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            backgroundImage: `url("${powerUpImage}")`,
            backgroundSize: '70%', // Slightly smaller than the cell
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            animation: 'pulse 1s infinite alternate', // Pulsing animation
            zIndex: 10, // Above map cells, below players
            filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.7))' // Glowing effect
        },
        'data-type': type,
        'aria-label': `${type} power-up`,
        title: getPowerUpDescription(type) // Tooltip on hover
    });
}

export default PowerUp;