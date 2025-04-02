/**
 * Game State
 * Manages the client-side game state
 */
import { getState, setState } from '../../src/index.js';

// Constants for game state
export const Screens = {
    LOGIN: 'login',
    WAITING: 'waiting',
    GAME: 'game',
    GAME_OVER: 'gameOver',
    ERROR: 'error'
};

export const PowerUpTypes = {
    BOMB: 'bomb',
    FLAME: 'flame',
    SPEED: 'speed'
};

// Initialize game state
export function initializeGameState() {
    setState({
        screen: Screens.LOGIN,
        player: {
            id: null,
            nickname: '',
        },
        waitingRoom: {
            players: [],
            countdown: null,
            chatMessages: [],
        },
        game: {
            id: null,
            players: [],
            map: null,
            bombs: [],
            powerUps: [],
            explosions: [],
            chatMessages: [],
            gameOver: false,
            winner: null,
            draw: false,
            yourId: null
        },
        performance: {
            fps: 0,
            lastFrameTime: 0,
            frameCount: 0,
            lastFpsUpdate: 0,
        },
        error: null
    });
}

// Helper functions for game state updates

/**
 * Set player information
 * @param {string} id - Player ID
 * @param {string} nickname - Player nickname
 */
export function setPlayerInfo(id, nickname) {
    setState({
        player: {
            ...getState().player,
            id,
            nickname
        }
    });
}

/**
 * Update waiting room state
 * @param {Object} updates - Updates to apply
 */
export function updateWaitingRoom(updates) {
    setState({
        waitingRoom: {
            ...getState().waitingRoom,
            ...updates
        }
    });
}

/**
 * Update game state
 * @param {Object} updates - Updates to apply
 */
export function updateGameState(updates) {
    setState({
        game: {
            ...getState().game,
            ...updates
        }
    });
}

/**
 * Set current screen
 * @param {string} screen - Screen identifier
 */
export function setScreen(screen) {
    setState({ screen });
}

/**
 * Add a chat message to the current screen
 * @param {Object} message - Chat message object
 */
export function addChatMessage(message) {
    const { screen } = getState();

    if (screen === Screens.WAITING) {
        const { chatMessages = [] } = getState().waitingRoom;
        updateWaitingRoom({
            chatMessages: [...chatMessages, message].slice(-50) // Keep last 50 messages
        });
    } else if (screen === Screens.GAME) {
        const { chatMessages = [] } = getState().game;
        updateGameState({
            chatMessages: [...chatMessages, message].slice(-50) // Keep last 50 messages
        });
    }
}

/**
 * Update player position in game
 * @param {string} playerId - Player ID
 * @param {Object} position - New position {x, y}
 */
export function updatePlayerPosition(playerId, position) {
    const { players } = getState().game;

    const updatedPlayers = players.map(player =>
        player.id === playerId
            ? { ...player, position }
            : player
    );

    updateGameState({ players: updatedPlayers });
}

/**
 * Update player stats in game
 * @param {string} playerId - Player ID
 * @param {Object} stats - Player stats to update
 */
export function updatePlayerStats(playerId, stats) {
    const { players } = getState().game;

    const updatedPlayers = players.map(player =>
        player.id === playerId
            ? { ...player, ...stats }
            : player
    );

    updateGameState({ players: updatedPlayers });
}

/**
 * Add a bomb to the game
 * @param {Object} bomb - Bomb object
 */
export function addBomb(bomb) {
    const { bombs } = getState().game;
    updateGameState({ bombs: [...bombs, bomb] });
}

/**
 * Remove a bomb from the game
 * @param {string} bombId - Bomb ID
 */
export function removeBomb(bombId) {
    const { bombs } = getState().game;
    updateGameState({
        bombs: bombs.filter(bomb => bomb.id !== bombId)
    });
}

/**
 * Add an explosion to the game
 * @param {Object} explosion - Explosion object
 */
export function addExplosion(explosion) {
    const { explosions } = getState().game;
    updateGameState({ explosions: [...explosions, explosion] });
}

/**
 * Remove an explosion from the game
 * @param {string} explosionId - Explosion ID
 */
export function removeExplosion(explosionId) {
    const { explosions } = getState().game;
    updateGameState({
        explosions: explosions.filter(explosion => explosion.id !== explosionId)
    });
}

/**
 * Add a power-up to the game
 * @param {Object} powerUp - Power-up object
 */
export function addPowerUp(powerUp) {
    const { powerUps } = getState().game;
    updateGameState({ powerUps: [...powerUps, powerUp] });
}

/**
 * Remove a power-up from the game
 * @param {string} powerUpId - Power-up ID
 */
export function removePowerUp(powerUpId) {
    const { powerUps } = getState().game;
    updateGameState({
        powerUps: powerUps.filter(powerUp => powerUp.id !== powerUpId)
    });
}

/**
 * Update the map by removing a block
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
export function removeBlockAt(x, y) {
    const { map } = getState().game;

    // Create a deep copy of the map grid
    const newGrid = map.grid.map((row, rowIndex) =>
        rowIndex === y
            ? row.map((cell, colIndex) => colIndex === x ? 0 : cell)
            : [...row]
    );

    updateGameState({ map: { ...map, grid: newGrid } });
}

/**
 * Set game over state
 * @param {Object} gameOverData - Game over data
 */
export function setGameOver(gameOverData) {
    updateGameState({
        gameOver: true,
        ...gameOverData
    });
}

/**
 * Reset game state for a new game
 */
export function resetGameState() {
    updateGameState({
        id: null,
        players: [],
        map: null,
        bombs: [],
        powerUps: [],
        explosions: [],
        chatMessages: [],
        gameOver: false,
        winner: null,
        draw: false,
        yourId: null
    });
}

/**
 * Set error state
 * @param {string} errorMessage - Error message
 */
export function setError(errorMessage) {
    setState({
        screen: Screens.ERROR,
        error: errorMessage
    });
}

/**
 * Get the current player's game data
 * @returns {Object|null} Current player data or null if not in a game
 */
export function getCurrentPlayerData() {
    const { game, player } = getState();
    if (!game.players.length || !player.id) return null;

    return game.players.find(p => p.id === player.id) || null;
}