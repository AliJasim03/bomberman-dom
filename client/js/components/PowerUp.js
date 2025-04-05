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
    const { type, x, y, cellSize, isCollecting } = props;

    // Calculate pixel position
    const pixelX = x * cellSize;
    const pixelY = y * cellSize;

    // Get power-up image
    const powerUpImage = getPowerUpImage(type);

    // Animation class based on collection state
    const animationStyle = isCollecting
        ? 'powerupCollected 0.5s forwards'
        : 'powerupFloat 2s infinite ease-in-out, powerupGlow 1.5s infinite ease-in-out';

    return createElement('div', {
        class: `power-up ${type}`,
        style: {
            position: 'absolute',
            top: `${pixelY}px`,
            left: `${pixelX}px`,
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            backgroundImage: `url("${powerUpImage}")`,
            backgroundSize: '80%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 10,
            animation: animationStyle
        },
        'data-type': type,
        'data-powerup-id': props.id,
        'aria-label': `${type} power-up`,
        title: getPowerUpDescription(type)
    });
}
export default PowerUp;