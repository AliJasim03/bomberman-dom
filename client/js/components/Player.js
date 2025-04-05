/**
 * Player Component
 * Renders a player on the game map
 */
import { createElement } from '../../../src/index.js';

/**
 * Get player sprite based on player ID
 * @param {string} playerId - Player ID
 * @returns {string} Path to player sprite image
 */
function getPlayerSprite(playerId) {
    // Extract numeric part of playerId to determine sprite
    const playerNum = parseInt(playerId.replace(/\D/g, '')) % 6 + 1;
    return `/assets/images/players/player${playerNum}.png`;
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
    const { player, isCurrentPlayer, cellSize, direction } = props;
    const { id, position, lives, nickname } = player;

    // Skip rendering if player is dead
    if (lives <= 0) {
        return null;
    }

    // Calculate pixel position
    const pixelX = position.x * cellSize;
    const pixelY = position.y * cellSize;

    // Get player sprite path
    const playerSprite = getPlayerSprite(id);

    // Add direction class for movement animation
    const directionClass = direction ? `moving-${direction}` : '';

    return createElement('div', {
        class: `player ${isCurrentPlayer ? 'current-player' : ''} ${directionClass}`,
        style: {
            top: `${pixelY}px`,
            left: `${pixelX}px`,
            backgroundImage: `url("${playerSprite}")`
        },
        'data-player-id': id,
        'aria-label': isCurrentPlayer ? 'You' : nickname
    }, [
        // Player name tag
        createElement('div', {
            class: `player-name ${isCurrentPlayer ? 'current-player' : ''}`,
        }, [
            isCurrentPlayer ? 'You' : nickname
        ])
    ]);
}

export default Player;