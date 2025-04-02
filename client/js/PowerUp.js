/**
 * PowerUp Component
 * Renders a power-up on the game map
 */
import { createElement } from '../../../src/index.js';

/**
 * Get power-up icon based on type
 * @param {string} type - Power-up type ('bomb', 'flame', 'speed')
 * @returns {string} Icon character
 */
function getPowerUpIcon(type) {
    switch (type) {
        case 'bomb':
            return '💣';
        case 'flame':
            return '🔥';
        case 'speed':
            return '👟';
        default:
            return '❓';
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

    // Get power-up icon
    const icon = getPowerUpIcon(type);

    return createElement('div', {
        class: `power-up ${type}`,
        style: {
            top: `${pixelY}px`,
            left: `${pixelX}px`,
            zIndex: 5 // Above map cells, below players
        },
        'data-type': type,
        'aria-label': `${type} power-up`
    }, [
        createElement('div', { class: 'power-up-icon' }, [icon])
    ]);
}

export default PowerUp;