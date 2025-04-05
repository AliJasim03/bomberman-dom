/**
 * PowerUp Component
 * Renders a power-up on the game map
 * Optimized to use CSS classes instead of inline styles
 */
import { createElement } from '../../../src/index.js';

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
    const { type, x, y, cellSize, isCollecting, id } = props;

    // Calculate pixel position
    const pixelX = x * cellSize;
    const pixelY = y * cellSize;

    // Animation class based on collection state
    const animationClass = isCollecting ? 'collecting' : '';

    return createElement('div', {
        class: `power-up ${type} ${animationClass}`,
        style: {
            top: `${pixelY}px`,
            left: `${pixelX}px`
        },
        'data-type': type,
        'data-powerup-id': id,
        'data-cell-x': x,
        'data-cell-y': y,
        'aria-label': `${type} power-up`,
        title: getPowerUpDescription(type)
    });
}

export default PowerUp;