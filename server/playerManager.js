/**
 * Player Manager
 * Manages player connections and state
 */

class PlayerManager {
    constructor() {
        this.players = new Map(); // Map of player ID to player data
        this.nextPlayerId = 1;    // Next player ID to assign
    }

    /**
     * Add a new player
     * @param {WebSocket} ws - WebSocket connection
     * @param {string} nickname - Player nickname
     * @returns {Object} Player data
     */
    addPlayer(ws, nickname) {
        // Generate unique ID
        const id = this.generatePlayerId();

        // Create player object
        const player = {
            id,
            nickname,
            ws,
            state: 'waiting',
            gameId: null,
            lives: 3,
            position: { x: 0, y: 0 },
            // Player stats
            bombs: 1,      // Number of bombs that can be placed at once
            flames: 1,      // Explosion range
            speed: 1,       // Movement speed
            disconnected: false,
            joinedAt: Date.now()
        };

        // Store player
        this.players.set(id, player);

        // Store player ID on websocket for easy reference
        ws.playerId = id;

        return player;
    }

    /**
     * Remove a player by ID
     * @param {string} playerId - Player ID
     * @returns {boolean} Success
     */
    removePlayer(playerId) {
        return this.players.delete(playerId);
    }

    /**
     * Get a player by ID
     * @param {string} playerId - Player ID
     * @returns {Object|undefined} Player data or undefined if not found
     */
    getPlayer(playerId) {
        return this.players.get(playerId);
    }

    /**
     * Get all players
     * @returns {Array} Array of player objects
     */
    getAllPlayers() {
        return Array.from(this.players.values());
    }

    /**
     * Get players in waiting state
     * @returns {Array} Array of players in waiting state
     */
    getWaitingPlayers() {
        return this.getAllPlayers().filter(player => player.state === 'waiting');
    }

    /**
     * Get players in a specific game
     * @param {string} gameId - Game ID
     * @returns {Array} Array of players in the game
     */
    getGamePlayers(gameId) {
        return this.getAllPlayers().filter(player =>
            player.state === 'playing' && player.gameId === gameId
        );
    }

    /**
     * Check if a nickname is already taken
     * @param {string} nickname - Nickname to check
     * @returns {boolean} True if nickname is taken
     */
    isNicknameTaken(nickname) {
        return this.getAllPlayers().some(player =>
            player.nickname.toLowerCase() === nickname.toLowerCase()
        );
    }

    /**
     * Update player state
     * @param {string} playerId - Player ID
     * @param {Object} updates - State updates
     * @returns {Object|undefined} Updated player or undefined if not found
     */
    updatePlayerState(playerId, updates) {
        const player = this.getPlayer(playerId);

        if (!player) return undefined;

        // Apply updates
        Object.assign(player, updates);

        return player;
    }

    /**
     * Send data to a specific player
     * @param {string} playerId - Player ID
     * @param {Object} data - Data to send
     * @returns {boolean} Success
     */
    sendToPlayer(playerId, data) {
        const player = this.getPlayer(playerId);

        if (!player || !player.ws || player.ws.readyState !== 1) {
            return false;
        }

        try {
            player.ws.send(JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error sending to player ${playerId}:`, error);
            return false;
        }
    }

    /**
     * Broadcast data to multiple players
     * @param {Array} playerIds - Array of player IDs
     * @param {Object} data - Data to broadcast
     * @param {string} excludeId - Player ID to exclude
     */
    broadcastToPlayers(playerIds, data, excludeId = null) {
        playerIds.forEach(playerId => {
            if (playerId !== excludeId) {
                this.sendToPlayer(playerId, data);
            }
        });
    }

    /**
     * Generate a unique player ID
     * @returns {string} Unique player ID
     */
    generatePlayerId() {
        return `player_${this.nextPlayerId++}`;
    }
}

module.exports = PlayerManager;