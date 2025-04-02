/**
 * Player Component
 * Renders a player on the game map
 */
import { createElement } from '../../../src/index.js';

/**
 * Get player color based on player ID
 * @param {string} playerId - Player ID
 * @param {boolean} isCurrentPlayer - Whether this is the current player
 * @returns {string} CSS color value
 */
function getPlayerColor(playerId, isCurrentPlayer) {
    if (isCurrentPlayer) {
        return '#4CAF50'; // Green for current player
    }

    // Generate a deterministic color based on player ID
    const hash = playerId.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    const colors = [
        '#F44336', // Red
        '#2196F3', // Blue
        '#FF9800', // Orange
        '#9C27B0', // Purple
        '#00BCD4', // Cyan
        '#FFEB3B'  // Yellow
    ];

    // Use the hash to select a color from the array
    return colors[Math.abs(hash) % colors.length];
}

/**
 * Player Component
 * @param {Object} props - Component props
 * @param {Object} props.player - Player data
 * @param {boolean} props.isCurrentPlayer - Whether this is the current player
 * @param {number} props.cellSize - Size of map cells in pixels
 * @returns {Object} Virtual DOM element
 */
function Player(props) {
    const { player, isCurrentPlayer, cellSize } = props;
    const { id, position, lives, nickname } = player;

    // Skip rendering if player is dead
    if (lives <= 0) {
        return null;
    }

    // Calculate pixel position
    const pixelX = position.x * cellSize;
    const pixelY = position.y * cellSize;

    // Get player color
    const playerColor = getPlayerColor(id, isCurrentPlayer);

    return createElement('div', {
        class: `player ${isCurrentPlayer ? 'current-player' : ''}`,
        key: `player-${id}`,
        style: {
            top: `${pixelY}px`,
            left: `${pixelX}px`,
            backgroundColor: playerColor,
            zIndex: 10 // Ensure players are above other elements
        },
        'data-player-id': id,
        'aria-label': isCurrentPlayer ? 'You' : nickname
    }, [
        // Player avatar
        createElement('div', { class: 'player-avatar' }),

        // Player name label
        createElement('div', { class: 'player-label' }, [
            isCurrentPlayer ? 'You' : nickname
        ])
    ]);
}

export default Player;