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
    const { player, isCurrentPlayer, cellSize } = props;
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

    // Render player stats if this is the current player
    const playerStats = isCurrentPlayer ?
        createElement('div', { class: 'player-stats' }, [
            createElement('div', { class: 'player-lives' }, [
                `Lives: ${lives}`
            ]),
            createElement('div', { class: 'player-bombs' }, [
                `Bombs: ${player.bombs || 1}`
            ]),
            createElement('div', { class: 'player-range' }, [
                `Range: ${player.flames || 1}`
            ]),
            createElement('div', { class: 'player-speed' }, [
                `Speed: ${player.speed || 1}`
            ])
        ]) : null;

    return createElement('div', {
        class: `player ${isCurrentPlayer ? 'current-player' : ''}`,
        style: {
            top: `${pixelY}px`,
            left: `${pixelX}px`,
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            backgroundImage: `url("${playerSprite}")`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'absolute',
            zIndex: 20, // Higher than other elements to appear on top
            transition: 'top 0.1s, left 0.1s', // Smooth movement
            filter: isCurrentPlayer ? 'drop-shadow(0 0 4px gold)' : 'none', // Highlight current player
        },
        'data-player-id': id,
        'aria-label': isCurrentPlayer ? 'You' : nickname
    }, [
        // Player name tag
        createElement('div', {
            class: 'player-name',
            style: {
                position: 'absolute',
                bottom: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                fontWeight: isCurrentPlayer ? 'bold' : 'normal'
            }
        }, [
            isCurrentPlayer ? 'You' : nickname
        ]),

        // Stats display for current player
        playerStats
    ]);
}

export default Player;