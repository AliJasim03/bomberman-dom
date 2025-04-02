/**
 * Game Manager
 * Manages game state, player connections, and game logic
 */
const mapGenerator = require('./utils/mapGenerator');
const PlayerManager = require('./playerManager');
const WebSocket = require('ws');

class GameManager {
    constructor() {
        this.playerManager = new PlayerManager();
        this.games = new Map();   // Map of active games
        this.waitingRoom = {
            startTimer: null,
            timerValue: 0,
            waitingPeriod: null
        };
    }

    /**
     * Add a new player to the waiting room
     * @param {WebSocket} ws - WebSocket connection
     * @param {string} nickname - Player nickname
     */
    addPlayer(ws, nickname) {
        // Check if nickname is taken
        if (this.playerManager.isNicknameTaken(nickname)) {
            this.send(ws, {
                type: 'ERROR',
                message: 'Nickname already taken'
            });
            return;
        }

        // Add player to manager
        const player = this.playerManager.addPlayer(ws, nickname);

        // Get waiting players
        const waitingPlayers = this.playerManager.getWaitingPlayers();

        // Send welcome message to the player
        this.send(ws, {
            type: 'JOIN_SUCCESS',
            id: player.id,
            playersCount: waitingPlayers.length,
            players: waitingPlayers.map(p => ({
                id: p.id,
                nickname: p.nickname
            }))
        });

        // Notify other players in waiting room
        this.broadcastToWaitingRoom({
            type: 'PLAYER_JOINED',
            player: { id: player.id, nickname: player.nickname },
            playersCount: waitingPlayers.length
        }, player.id);

        // Check if we need to start a timer for the game
        this.checkGameStartConditions();
    }

    /**
     * Remove a player from the game
     * @param {string} playerId - Player ID to remove
     */
    removePlayer(playerId) {
        const player = this.playerManager.getPlayer(playerId);

        if (!player) return;

        // If player is in waiting room
        if (player.state === 'waiting') {
            // Remove player
            this.playerManager.removePlayer(playerId);

            // Get updated waiting players
            const waitingPlayers = this.playerManager.getWaitingPlayers();

            // Notify waiting room players
            this.broadcastToWaitingRoom({
                type: 'PLAYER_LEFT',
                playerId,
                playersCount: waitingPlayers.length
            });

            // Check if we need to cancel the timer
            if (waitingPlayers.length < 2 && this.waitingRoom.startTimer) {
                clearInterval(this.waitingRoom.startTimer);
                this.waitingRoom.startTimer = null;
                this.waitingRoom.timerValue = 0;

                this.broadcastToWaitingRoom({
                    type: 'TIMER_CANCELED'
                });
            }
        }
        // If player is in a game
        else if (player.state === 'playing' && player.gameId) {
            const game = this.games.get(player.gameId);

            if (game) {
                // Mark player as disconnected in the game
                const gamePlayer = game.players.find(p => p.id === playerId);
                if (gamePlayer) {
                    gamePlayer.disconnected = true;
                    gamePlayer.lives = 0;

                    // Notify other players in the game
                    this.broadcastToGame(game.id, {
                        type: 'PLAYER_DISCONNECTED',
                        playerId
                    });

                    // Check if game is over
                    this.checkGameOver(game.id);
                }
            }

            // Remove player
            this.playerManager.removePlayer(playerId);
        }
    }

    /**
     * Check conditions to start the game timer
     */
    checkGameStartConditions() {
        // Get waiting players
        const waitingPlayers = this.playerManager.getWaitingPlayers();
        const playerCount = waitingPlayers.length;

        // If we have 4 players, start the game countdown immediately
        if (playerCount === 4 && !this.waitingRoom.startTimer) {
            this.startGameCountdown(10);
        }
        // If we have 2-3 players, start a 20-second waiting period
        else if (playerCount >= 2 && playerCount < 4 && !this.waitingRoom.startTimer && !this.waitingRoom.waitingPeriod) {
            // Set waiting period
            this.waitingRoom.waitingPeriod = setTimeout(() => {
                this.waitingRoom.waitingPeriod = null;

                // Check if we still have enough players
                const currentWaitingPlayers = this.playerManager.getWaitingPlayers();
                if (currentWaitingPlayers.length >= 2) {
                    this.startGameCountdown(10);
                }
            }, 20000);

            // Notify players of the waiting period
            this.broadcastToWaitingRoom({
                type: 'WAITING_PERIOD_STARTED',
                seconds: 20
            });
        }
    }

    /**
     * Start the game countdown
     * @param {number} seconds - Countdown duration in seconds
     */
    startGameCountdown(seconds) {
        if (this.waitingRoom.startTimer) return;

        this.waitingRoom.timerValue = seconds;

        // Notify players that countdown has started
        this.broadcastToWaitingRoom({
            type: 'GAME_COUNTDOWN_STARTED',
            seconds
        });

        // Start countdown
        this.waitingRoom.startTimer = setInterval(() => {
            this.waitingRoom.timerValue--;

            // Notify players of current countdown
            this.broadcastToWaitingRoom({
                type: 'GAME_COUNTDOWN_UPDATE',
                seconds: this.waitingRoom.timerValue
            });

            // If countdown reaches 0, start the game
            if (this.waitingRoom.timerValue <= 0) {
                clearInterval(this.waitingRoom.startTimer);
                this.waitingRoom.startTimer = null;
                this.startGame();
            }
        }, 1000);
    }

    /**
     * Start a new game with players from waiting room
     */
    startGame() {
        // Get waiting players
        const waitingPlayers = this.playerManager.getWaitingPlayers();

        // Take at most 4 players for the game
        const gamePlayers = waitingPlayers.slice(0, 4);

        if (gamePlayers.length < 2) {
            // Not enough players to start a game
            return;
        }

        // Generate a unique game ID
        const gameId = Math.random().toString(36).substr(2, 9);

        // Generate map for the game
        const map = mapGenerator.generateMap(gamePlayers.length);

        // Set up initial player positions at corners
        const startPositions = [
            { x: 1, y: 1 },                   // Top-left
            { x: map.width - 2, y: map.height - 2 }, // Bottom-right
            { x: map.width - 2, y: 1 },              // Top-right
            { x: 1, y: map.height - 2 }              // Bottom-left
        ];

        // Create game object
        const game = {
            id: gameId,
            status: 'playing',
            map,
            players: gamePlayers.map((player, index) => {
                // Update player state
                this.playerManager.updatePlayerState(player.id, {
                    state: 'playing',
                    gameId,
                    position: startPositions[index],
                    lives: 3,
                    bombs: 1,
                    flames: 1,
                    speed: 1
                });

                // Return game player object
                return {
                    id: player.id,
                    nickname: player.nickname,
                    position: startPositions[index],
                    lives: 3,
                    bombs: 1,
                    flames: 1,
                    speed: 1,
                    disconnected: false
                };
            }),
            bombs: [],
            powerUps: [],
            explosions: [],
            startTime: Date.now()
        };

        // Store the game
        this.games.set(gameId, game);

        // Notify players that game is starting
        gamePlayers.forEach(player => {
            this.playerManager.sendToPlayer(player.id, {
                type: 'GAME_STARTED',
                gameId,
                map: game.map,
                players: game.players,
                yourId: player.id
            });
        });

        // Start game loop for this game
        this.startGameLoop(gameId);
    }

    /**
     * Start the game loop for a specific game
     * @param {string} gameId - Game ID
     */
    startGameLoop(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;

        // Game loop runs at 60fps (16.67ms)
        const gameLoop = setInterval(() => {
            if (!this.games.has(gameId)) {
                clearInterval(gameLoop);
                return;
            }

            // Update bomb timers and check for explosions
            this.updateBombs(gameId);

            // Send game state to all players
            this.broadcastGameState(gameId);
        }, 16.67); // ~60fps

        // Store loop reference for cleanup
        game.gameLoop = gameLoop;
    }

    /**
     * Update bombs in the game (countdown and explosions)
     * @param {string} gameId - Game ID
     */
    updateBombs(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;

        const now = Date.now();
        const explodedBombs = [];

        // Update bomb timers and check for explosions
        game.bombs.forEach(bomb => {
            if (now - bomb.placedAt >= 2000) { // 2 seconds until explosion
                explodedBombs.push(bomb);
            }
        });

        // Process explosions
        explodedBombs.forEach(bomb => {
            this.explodeBomb(gameId, bomb);
        });

        // Remove exploded bombs
        game.bombs = game.bombs.filter(bomb => !explodedBombs.includes(bomb));
    }

    /**
     * Process a bomb explosion
     * @param {string} gameId - Game ID
     * @param {Object} bomb - Bomb object
     */
    explodeBomb(gameId, bomb) {
        const game = this.games.get(gameId);
        if (!game) return;

        const { x, y, playerId, flameSize } = bomb;

        // Calculate explosion cells (in four directions)
        const explosionCells = [{ x, y }]; // Center of explosion

        // Directions: up, right, down, left
        const directions = [
            { dx: 0, dy: -1 }, // Up
            { dx: 1, dy: 0 },  // Right
            { dx: 0, dy: 1 },  // Down
            { dx: -1, dy: 0 }  // Left
        ];

        directions.forEach(dir => {
            for (let i = 1; i <= flameSize; i++) {
                const newX = x + (dir.dx * i);
                const newY = y + (dir.dy * i);

                // Check if we hit a wall
                if (this.isWall(game.map, newX, newY)) {
                    break;
                }

                // Add this cell to explosion
                explosionCells.push({ x: newX, y: newY });

                // Check if we hit a block
                if (this.isBlock(game.map, newX, newY)) {
                    // Destroy the block
                    this.destroyBlock(gameId, newX, newY);
                    break; // Stop the explosion in this direction
                }
            }
        });

        // Create explosion object
        const explosion = {
            id: bomb.id,
            cells: explosionCells,
            createdAt: Date.now()
        };

        // Add explosion to game
        game.explosions.push(explosion);

        // Check for players in explosion range
        game.players.forEach(player => {
            if (player.lives <= 0) return; // Skip dead players

            // Check if player is in any explosion cell
            const isHit = explosionCells.some(cell =>
                cell.x === player.position.x && cell.y === player.position.y
            );

            if (isHit) {
                // Player is hit by explosion
                player.lives--;

                // Notify all players of the hit
                this.broadcastToGame(gameId, {
                    type: 'PLAYER_HIT',
                    playerId: player.id,
                    livesLeft: player.lives
                });

                // Check if player is eliminated
                if (player.lives <= 0) {
                    this.broadcastToGame(gameId, {
                        type: 'PLAYER_ELIMINATED',
                        playerId: player.id
                    });

                    // Check if game is over
                    this.checkGameOver(gameId);
                }
            }
        });

        // Notify all players of the explosion
        this.broadcastToGame(gameId, {
            type: 'BOMB_EXPLODED',
            bombId: bomb.id,
            explosionCells
        });

        // Remove explosion after 1 second
        setTimeout(() => {
            const currentGame = this.games.get(gameId);
            if (currentGame) {
                currentGame.explosions = currentGame.explosions.filter(e => e.id !== explosion.id);
            }
        }, 1000);
    }

    /**
     * Destroy a block on the map
     * @param {string} gameId - Game ID
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    destroyBlock(gameId, x, y) {
        const game = this.games.get(gameId);
        if (!game) return;

        // Update map to remove the block
        game.map.grid[y][x] = 0;

        // Chance to spawn a power-up (30%)
        if (Math.random() < 0.3) {
            // Create a power-up
            const powerUpTypes = ['bomb', 'flame', 'speed'];
            const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

            const powerUp = {
                id: Math.random().toString(36).substr(2, 9),
                type,
                x,
                y
            };

            game.powerUps.push(powerUp);

            // Notify all players of the new power-up
            this.broadcastToGame(gameId, {
                type: 'POWER_UP_SPAWNED',
                powerUp
            });
        }

        // Notify all players of the destroyed block
        this.broadcastToGame(gameId, {
            type: 'BLOCK_DESTROYED',
            position: { x, y }
        });
    }

    /**
     * Check if a game is over (only one player left)
     * @param {string} gameId - Game ID
     */
    checkGameOver(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;

        // Count players that are still alive
        const alivePlayers = game.players.filter(p => p.lives > 0);

        // If only one player is alive, they win
        if (alivePlayers.length === 1) {
            const winner = alivePlayers[0];

            // Notify all players of the winner
            this.broadcastToGame(gameId, {
                type: 'GAME_OVER',
                winner: {
                    id: winner.id,
                    nickname: winner.nickname
                }
            });

            // End the game after 5 seconds
            setTimeout(() => {
                this.endGame(gameId);
            }, 5000);
        }
        // If no players are alive, it's a draw
        else if (alivePlayers.length === 0) {
            this.broadcastToGame(gameId, {
                type: 'GAME_OVER',
                draw: true
            });

            // End the game after 5 seconds
            setTimeout(() => {
                this.endGame(gameId);
            }, 5000);
        }
    }

    /**
     * End a game and clean up resources
     * @param {string} gameId - Game ID
     */
    endGame(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;

        // Stop game loop
        if (game.gameLoop) {
            clearInterval(game.gameLoop);
        }

        // Update players and return them to waiting room
        game.players.forEach(gamePlayer => {
            const player = this.playerManager.getPlayer(gamePlayer.id);

            if (player) {
                // Update player state
                this.playerManager.updatePlayerState(player.id, {
                    state: 'waiting',
                    gameId: null,
                });

                // Notify player they're back in waiting room
                const waitingPlayers = this.playerManager.getWaitingPlayers();

                this.playerManager.sendToPlayer(player.id, {
                    type: 'RETURNED_TO_WAITING_ROOM',
                    playersCount: waitingPlayers.length,
                    players: waitingPlayers.map(p => ({
                        id: p.id,
                        nickname: p.nickname
                    }))
                });
            }
        });

        // Remove the game
        this.games.delete(gameId);

        // Check if we need to start a new game
        this.checkGameStartConditions();
    }

    /**
     * Update player position based on movement input
     * @param {string} playerId - Player ID
     * @param {string} direction - Movement direction ('up', 'down', 'left', 'right')
     */
    updatePlayerPosition(playerId, direction) {
        const player = this.playerManager.getPlayer(playerId);
        if (!player || player.state !== 'playing' || !player.gameId) return;

        const game = this.games.get(player.gameId);
        if (!game) return;

        // Find player in game
        const gamePlayer = game.players.find(p => p.id === playerId);
        if (!gamePlayer || gamePlayer.lives <= 0) return;

        // Current position
        let { x, y } = gamePlayer.position;

        // Calculate new position based on direction
        let newX = x;
        let newY = y;

        const speed = gamePlayer.speed;

        switch (direction) {
            case 'up':
                newY -= 1;
                break;
            case 'down':
                newY += 1;
                break;
            case 'left':
                newX -= 1;
                break;
            case 'right':
                newX += 1;
                break;
        }

        // Check for collisions with walls, blocks, or bombs
        if (
            this.isWall(game.map, newX, newY) ||
            this.isBlock(game.map, newX, newY) ||
            this.isBomb(game, newX, newY)
        ) {
            // Can't move there
            return;
        }

        // Update player position
        gamePlayer.position = { x: newX, y: newY };

        // Update position in player manager too
        this.playerManager.updatePlayerState(playerId, {
            position: { x: newX, y: newY }
        });

        // Check for power-up collection
        const powerUpIndex = game.powerUps.findIndex(
            p => p.x === newX && p.y === newY
        );

        if (powerUpIndex !== -1) {
            const powerUp = game.powerUps[powerUpIndex];

            // Apply power-up effect
            switch (powerUp.type) {
                case 'bomb':
                    gamePlayer.bombs++;
                    break;
                case 'flame':
                    gamePlayer.flames++;
                    break;
                case 'speed':
                    gamePlayer.speed++;
                    break;
            }

            // Update player in player manager too
            this.playerManager.updatePlayerState(playerId, {
                [powerUp.type]: gamePlayer[powerUp.type]
            });

            // Remove the power-up
            game.powerUps.splice(powerUpIndex, 1);

            // Notify all players of the collected power-up
            this.broadcastToGame(player.gameId, {
                type: 'POWER_UP_COLLECTED',
                playerId,
                powerUpId: powerUp.id,
                powerUpType: powerUp.type
            });
        }

        // No need to broadcast full state here as the game loop will do it
    }

    /**
     * Place a bomb at player's position
     * @param {string} playerId - Player ID
     */
    placeBomb(playerId) {
        const player = this.playerManager.getPlayer(playerId);
        if (!player || player.state !== 'playing' || !player.gameId) return;

        const game = this.games.get(player.gameId);
        if (!game) return;

        // Find player in game
        const gamePlayer = game.players.find(p => p.id === playerId);
        if (!gamePlayer || gamePlayer.lives <= 0) return;

        // Check if player has bombs available
        const activeBombs = game.bombs.filter(b => b.playerId === playerId).length;
        if (activeBombs >= gamePlayer.bombs) return;

        // Get player position
        const { x, y } = gamePlayer.position;

        // Check if there's already a bomb at this position
        if (game.bombs.some(b => b.x === x && b.y === y)) return;

        // Create a new bomb
        const bomb = {
            id: Math.random().toString(36).substr(2, 9),
            playerId,
            x,
            y,
            placedAt: Date.now(),
            flameSize: gamePlayer.flames
        };

        // Add bomb to the game
        game.bombs.push(bomb);

        // Notify all players of the new bomb
        this.broadcastToGame(player.gameId, {
            type: 'BOMB_PLACED',
            bomb
        });
    }

    /**
     * Broadcast a chat message to all players in a game
     * @param {string} senderId - Sender player ID
     * @param {string} message - Chat message
     */
    broadcastChat(senderId, message) {
        const player = this.playerManager.getPlayer(senderId);
        if (!player) return;

        // If player is in waiting room
        if (player.state === 'waiting') {
            this.broadcastToWaitingRoom({
                type: 'CHAT_MESSAGE',
                senderId,
                sender: player.nickname,
                message,
                timestamp: Date.now()
            });
        }
        // If player is in a game
        else if (player.state === 'playing' && player.gameId) {
            this.broadcastToGame(player.gameId, {
                type: 'CHAT_MESSAGE',
                senderId,
                sender: player.nickname,
                message,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Broadcast current game state to all players in a game
     * @param {string} gameId - Game ID
     */
    broadcastGameState(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;

        // Create simplified state object to send to clients
        const state = {
            players: game.players.map(p => ({
                id: p.id,
                position: p.position,
                lives: p.lives,
                bombs: p.bombs,
                flames: p.flames,
                speed: p.speed
            })),
            bombs: game.bombs,
            powerUps: game.powerUps,
            explosions: game.explosions
        };

        // Broadcast to all players
        this.broadcastToGame(gameId, {
            type: 'GAME_STATE_UPDATE',
            state
        });
    }

    /**
     * Check if a position is a wall
     * @param {Object} map - Game map
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if position is a wall
     */
    isWall(map, x, y) {
        // Check boundaries
        if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
            return true;
        }

        // Check if cell is a wall (value 2)
        return map.grid[y][x] === 2;
    }

    /**
     * Check if a position is a destructible block
     * @param {Object} map - Game map
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if position is a block
     */
    isBlock(map, x, y) {
        // Check boundaries
        if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
            return true;
        }

        // Check if cell is a block (value 1)
        return map.grid[y][x] === 1;
    }

    /**
     * Check if a position has a bomb
     * @param {Object} game - Game object
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if position has a bomb
     */
    isBomb(game, x, y) {
        return game.bombs.some(bomb => bomb.x === x && bomb.y === y);
    }

    /**
     * Send a message to a specific client
     * @param {WebSocket} ws - WebSocket connection
     * @param {Object} data - Data to send
     */
    send(ws, data) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }

    /**
     * Broadcast a message to all players in the waiting room
     * @param {Object} data - Data to broadcast
     * @param {string} excludeId - Player ID to exclude from broadcast
     */
    broadcastToWaitingRoom(data, excludeId = null) {
        const waitingPlayers = this.playerManager.getWaitingPlayers();

        waitingPlayers.forEach(player => {
            if (excludeId && player.id === excludeId) return;
            this.playerManager.sendToPlayer(player.id, data);
        });
    }

    /**
     * Broadcast a message to all players in a game
     * @param {string} gameId - Game ID
     * @param {Object} data - Data to broadcast
     * @param {string} excludeId - Player ID to exclude from broadcast
     */
    broadcastToGame(gameId, data, excludeId = null) {
        const game = this.games.get(gameId);
        if (!game) return;

        const gamePlayers = this.playerManager.getGamePlayers(gameId);

        gamePlayers.forEach(player => {
            if (excludeId && player.id === excludeId) return;
            this.playerManager.sendToPlayer(player.id, data);
        });
    }

    /**
     * Check if games need to be started (called regularly)
     */
    checkGameStart() {
        // If we have a start timer, no need to check
        if (this.waitingRoom.startTimer) return;

        // Check conditions to start game
        this.checkGameStartConditions();
    }
}