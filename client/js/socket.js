/**
 * WebSocket client for Bomberman DOM
 * Handles all communication with the server
 */
import {getState, setState} from '../../src/index.js';
import {attemptReconnect} from './app.js';
import {playSound} from "../utils/audio.js";

// Batch processing for chat messages
let pendingMessages = [];
let chatUpdateScheduled = false;

/**
 * Initialize WebSocket connection
 */
export function initSocket() {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === '' ? 'localhost:3000' : window.location.host;
    const socket = new WebSocket(`${protocol}//${host}`);

    // Store socket in window for easy access
    window.socket = socket;

    // Handle connection opening
    socket.addEventListener('open', () => {
        console.log('WebSocket connection established');

        // Attempt to reconnect if we have session data
        const state = getState();
        if (state.reconnecting) {
            console.log('Socket open, attempting reconnection');
            attemptReconnect();
        }
    });

    // Handle incoming messages
    socket.addEventListener('message', event => {
        try {
            const data = JSON.parse(event.data);
            handleMessage(data);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    });

    // Handle connection closing
    socket.addEventListener('close', () => {
        console.log('WebSocket connection closed');

        // Show error message and reconnect button
        setState({
            screen: 'error',
            error: 'Connection to server lost. Please refresh the page to reconnect.'
        });
    });

    // Handle connection error
    socket.addEventListener('error', error => {
        console.error('WebSocket error:', error);
    });
}

/**
 * Handle incoming WebSocket messages
 * @param {Object} data - Message data
 */
function handleMessage(data) {
    const {type} = data;
    // Determine if this update should trigger re-render
    const shouldRerender = shouldTriggerRerender(type, data);
    // Set a global variable to control re-rendering
    window.shouldRerender = shouldRerender;

    switch (type) {
        case 'JOIN_SUCCESS':
            handleJoinSuccess(data);
            break;

        case 'ERROR':
            handleError(data);
            break;

        case 'PLAYER_JOINED':
            handlePlayerJoined(data);
            break;

        case 'PLAYER_LEFT':
            handlePlayerLeft(data);
            break;

        case 'WAITING_PERIOD_STARTED':
            handleWaitingPeriod(data);
            break;

        case 'GAME_COUNTDOWN_STARTED':
            handleGameCountdown(data);
            break;

        case 'GAME_COUNTDOWN_UPDATE':
            handleCountdownUpdate(data);
            break;

        case 'TIMER_CANCELED':
            handleTimerCanceled();
            break;

        case 'GAME_STARTED':
            handleGameStarted(data);
            break;

        case 'GAME_STATE_UPDATE':
            handleGameStateUpdate(data);
            break;

        case 'BOMB_PLACED':
            handleBombPlaced(data);
            break;

        case 'BOMB_EXPLODED':
            handleBombExploded(data);
            break;

        case 'BLOCK_DESTROYED':
            handleBlockDestroyed(data);
            break;

        case 'POWER_UP_SPAWNED':
            handlePowerUpSpawned(data);
            break;

        case 'POWER_UP_COLLECTED':
            handlePowerUpCollected(data);
            break;

        case 'PLAYER_HIT':
            handlePlayerHit(data);
            break;

        case 'PLAYER_ELIMINATED':
            handlePlayerEliminated(data);
            break;

        case 'PLAYER_DISCONNECTED':
            handlePlayerDisconnected(data);
            break;

        case 'CHAT_MESSAGE':
            handleChatMessage(data);
            break;

        case 'GAME_OVER':
            handleGameOver(data);
            break;

        case 'RETURNED_TO_WAITING_ROOM':
            handleReturnToWaitingRoom(data);
            break;

        default:
            console.warn('Unknown message type:', type);
    }

    // Reset re-render flag after handling message
    window.shouldRerender = true;
}

/**
 * Handle successful login
 * @param {Object} data - Message data
 */
function handleJoinSuccess(data) {
    const {id, playersCount, players} = data;
    const state = getState();

    // Save session to localStorage for reconnection
    localStorage.setItem('bomberman-session', JSON.stringify({
        playerId: id,
        nickname: state.player.nickname
    }));

    // Update player information
    setState({
        reconnecting: false,  // No longer reconnecting
        screen: 'waiting',
        player: {
            ...state.player,
            id
        },
        waitingRoom: {
            players,
            countdown: null,
            playersCount,
            chatMessages: state.waitingRoom.chatMessages || []
        }
    });
}

/**
 * Handle error messages
 * @param {Object} data - Message data
 */
function handleError(data) {
    const {message} = data;

    // Show error message
    alert(`Error: ${message}`);
}

/**
 * Handle new player joining the waiting room
 * @param {Object} data - Message data
 */
function handlePlayerJoined(data) {
    const {player, playersCount} = data;
    const state = getState();

    console.log('Player joined:', player);

    // Add player to waiting room
    setState({
        waitingRoom: {
            ...state.waitingRoom,
            players: [...state.waitingRoom.players, player],
            playersCount
        }
    });

    // Create a direct DOM update to show the new player immediately
    const playersList = document.querySelector('.player-list');
    if (playersList && player) {
        // Create a new player item element
        const playerItem = document.createElement('li');
        playerItem.className = 'player-item';
        playerItem.style.animation = 'slideInUp 0.3s ease-out';

        // Determine if this is the current user
        const isCurrentUser = player.id === state.player.id;

        // Create indicator
        const indicator = document.createElement('span');
        indicator.className = `player-indicator ${isCurrentUser ? 'you' : ''}`;
        indicator.textContent = isCurrentUser ? 'You' : '';

        // Create name element
        const nameEl = document.createElement('span');
        nameEl.className = 'player-name';
        nameEl.textContent = player.nickname;

        // Assemble player item
        playerItem.appendChild(indicator);
        playerItem.appendChild(nameEl);

        // Add to list
        playersList.appendChild(playerItem);
    }

    // Update player counter directly in DOM
    const counterEl = document.querySelector('.counter');
    if (counterEl) {
        counterEl.textContent = playersCount.toString();
    }
}

/**
 * Handle player leaving the waiting room
 * @param {Object} data - Message data
 */
function handlePlayerLeft(data) {
    const {playerId, playersCount} = data;
    const state = getState();

    console.log('Player left:', playerId);

    // Remove player from waiting room
    setState({
        waitingRoom: {
            ...state.waitingRoom,
            players: state.waitingRoom.players.filter(p => p.id !== playerId),
            playersCount
        }
    });

    // Direct DOM update to remove the player element
    const playerItem = document.querySelector(`[data-player-id="${playerId}"]`);
    if (playerItem) {
        // Fade out animation
        playerItem.style.opacity = '0';
        setTimeout(() => {
            if (playerItem.parentNode) {
                playerItem.parentNode.removeChild(playerItem);
            }
        }, 300);
    }

    // Update player counter directly in DOM
    const counterEl = document.querySelector('.counter');
    if (counterEl) {
        counterEl.textContent = playersCount.toString();
    }
}
/**
 * Handle waiting period started
 * @param {Object} data - Message data
 */
function handleWaitingPeriod(data) {
    const {seconds} = data;
    const state = getState();

    // Update waiting room state
    setState({
        waitingRoom: {
            ...state.waitingRoom,
            waitingPeriod: seconds
        }
    });
}

/**
 * Handle game countdown started
 * @param {Object} data - Message data
 */
function handleGameCountdown(data) {
    const {seconds} = data;
    const state = getState();

    console.log(`Countdown started: ${seconds} seconds`);

    // Update waiting room state
    setState({
        waitingRoom: {
            ...state.waitingRoom,
            countdown: seconds
        }
    });

    // Also display a notification
    if (document.getElementById('countdown-notification')) {
        document.getElementById('countdown-notification').textContent =
            `Game starting in ${seconds} seconds!`;
    }
}

/**
 * Handle countdown update
 * @param {Object} data - Message data
 */
function handleCountdownUpdate(data) {
    const {seconds} = data;
    const state = getState();

    // Update state without re-render
    if (state.waitingRoom) {
        state.waitingRoom.countdown = seconds;
    }

    // Update DOM directly
    const countdownEl = document.getElementById('countdown-notification');
    if (countdownEl) {
        countdownEl.textContent = `Game starting in: ${seconds}s`;
        countdownEl.className = 'countdown active';
    }
}

/**
 * Handle timer canceled
 */
function handleTimerCanceled() {
    const state = getState();

    // Update waiting room state
    setState({
        waitingRoom: {
            ...state.waitingRoom,
            countdown: null,
            waitingPeriod: null
        }
    });
}

/**
 * Handle game started
 * @param {Object} data - Message data
 */
function handleGameStarted(data) {
    const {gameId, map, players, yourId} = data;
    const state = getState();

    // Update session to include game info
    localStorage.setItem('bomberman-session', JSON.stringify({
        playerId: yourId,
        nickname: state.player.nickname,
        gameId
    }));

    // Transfer chat messages from waiting room to game
    const waitingRoomChat = state.waitingRoom.chatMessages || [];

    // Update game state
    setState({
        screen: 'game',
        game: {
            ...state.game,
            id: gameId,
            map,
            players,
            yourId,
            bombs: [],
            powerUps: [],
            explosions: [],
            chatMessages: waitingRoomChat // Carry over chat messages
        }
    });
}

/**
 * Handle game state update
 * @param {Object} data - Message data
 */
function handleGameStateUpdate(data) {
    const {state: gameState} = data;
    const state = getState();

    // Check if only player positions changed - if so, update directly without re-render
    const isOnlyPositionsChanged =
        // Same number of players
        gameState.players.length === state.game.players.length &&
        // Same bombs, powerUps, explosions
        gameState.bombs.length === state.game.bombs.length &&
        gameState.powerUps.length === state.game.powerUps.length &&
        gameState.explosions.length === state.game.explosions.length;

    if (isOnlyPositionsChanged) {
        // Just update positions directly using DOM manipulation
        gameState.players.forEach(newPlayerData => {
            const playerElement = document.querySelector(`[data-player-id="${newPlayerData.id}"]`);
            if (playerElement) {
                // Update position
                const cellSize = 40; // Cell size in pixels
                playerElement.style.top = `${newPlayerData.position.y * cellSize}px`;
                playerElement.style.left = `${newPlayerData.position.x * cellSize}px`;
            }
        });

        // Update state without triggering re-render
        setState({
            game: {
                ...state.game,
                players: gameState.players.map(newPlayerData => {
                    // Preserve existing data like nickname that might not be in update
                    const existingPlayer = state.game.players.find(p => p.id === newPlayerData.id);
                    return { ...existingPlayer, ...newPlayerData };
                })
            }
        }, false); // false = don't trigger re-render
    } else {
        // There are other changes - do a normal update
        const updatedPlayers = gameState.players.map(newPlayerData => {
            // Try to find the existing player to keep the nickname
            const existingPlayer = state.game.players.find(p => p.id === newPlayerData.id);
            if (existingPlayer && existingPlayer.nickname) {
                return { ...newPlayerData, nickname: existingPlayer.nickname };
            }
            return newPlayerData;
        });

        // Update game state
        setState({
            game: {
                ...state.game,
                players: updatedPlayers,
                bombs: gameState.bombs,
                powerUps: gameState.powerUps,
                explosions: gameState.explosions || state.game.explosions
            }
        });
    }
}

/**
 * Handle bomb placed
 * @param {Object} data - Message data
 */
function handleBombPlaced(data) {
    const {bomb} = data;
    const state = getState();

    // Add bomb to game state
    setState({
        game: {
            ...state.game,
            bombs: [...state.game.bombs, bomb]
        }
    });

    // Add a flash effect to the game map
    const mapEl = document.querySelector('.game-map');
    if (mapEl) {
        mapEl.style.boxShadow = '0 0 20px rgba(231, 76, 60, 0.7)';
        setTimeout(() => {
            mapEl.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
        }, 200);
    }
}

function applyScreenShake() {
    const gameMap = document.querySelector('.game-map-container');
    if (gameMap) {
        // Remove existing shake class to restart animation
        gameMap.classList.remove('screen-shake');

        // Force browser to acknowledge the change
        void gameMap.offsetWidth;

        // Add shake class to trigger animation
        gameMap.classList.add('screen-shake');

        // Remove class after animation
        setTimeout(() => {
            gameMap.classList.remove('screen-shake');
        }, 500);
    }
}

/**
 * Handle bomb exploded
 * @param {Object} data - Message data
 */
function handleBombExploded(data) {
    const {bombId, explosionCells} = data;
    const state = getState();

    // Remove bomb from game state
    const bombs = state.game.bombs.filter(b => b.id !== bombId);

    // Add explosion animation
    const explosion = {
        id: bombId,
        cells: explosionCells,
        createdAt: Date.now()
    };

    setState({
        game: {
            ...state.game,
            bombs,
            explosions: [...state.game.explosions, explosion]
        }
    });
    applyScreenShake();

    playSound('/audio/explosion.wav', 0.6);

    // Remove explosion after animation completes (1 second)
    setTimeout(() => {
        const currentState = getState();
        if (currentState.screen === 'game') {
            setState({
                game: {
                    ...currentState.game,
                    explosions: currentState.game.explosions.filter(e => e.id !== bombId)
                }
            });
        }
    }, 1000);
}

/**
 * Handle block destroyed
 * @param {Object} data - Message data
 */
function handleBlockDestroyed(data) {
    const {position} = data;
    const state = getState();

    // Update map to remove block
    const newMap = {
        ...state.game.map,
        grid: state.game.map.grid.map((row, y) =>
            y === position.y
                ? row.map((cell, x) => x === position.x ? 0 : cell)
                : row
        )
    };

    setState({
        game: {
            ...state.game,
            map: newMap
        }
    });
}

/**
 * Handle power-up spawned
 * @param {Object} data - Message data
 */
function handlePowerUpSpawned(data) {
    const {powerUp} = data;
    const state = getState();

    // Add power-up to game state
    setState({
        game: {
            ...state.game,
            powerUps: [...state.game.powerUps, powerUp]
        }
    });
}

/**
 * Handle power-up collected
 * @param {Object} data - Message data
 */
function handlePowerUpCollected(data) {
    const {powerUpId} = data;
    const state = getState();

    // Remove power-up from game state
    setState({
        game: {
            ...state.game,
            powerUps: state.game.powerUps.filter(p => p.id !== powerUpId)
        }
    });
}

/**
 * Handle player hit by explosion
 * @param {Object} data - Message data
 */
function handlePlayerHit(data) {
    const {playerId, livesLeft} = data;
    const state = getState();

    // Update player lives
    const players = state.game.players.map(player =>
        player.id === playerId
            ? {...player, lives: livesLeft}
            : player
    );

    setState({
        game: {
            ...state.game,
            players
        }
    });
}

/**
 * Handle player eliminated
 * @param {Object} data - Message data
 */
function handlePlayerEliminated(data) {
    const {playerId} = data;
    const state = getState();

    // Update player status
    const players = state.game.players.map(player =>
        player.id === playerId
            ? {...player, lives: 0, eliminated: true}
            : player
    );

    setState({
        game: {
            ...state.game,
            players
        }
    });
}

/**
 * Handle player disconnected
 * @param {Object} data - Message data
 */
function handlePlayerDisconnected(data) {
    const {playerId} = data;
    const state = getState();

    // Update player status
    const players = state.game.players.map(player =>
        player.id === playerId
            ? {...player, disconnected: true}
            : player
    );

    setState({
        game: {
            ...state.game,
            players
        }
    });
}

/**
 * Handle game over
 * @param {Object} data - Message data
 */
function handleGameOver(data) {
    const {winner, draw} = data;
    const state = getState();

    // Update game state
    setState({
        game: {
            ...state.game,
            gameOver: true,
            winner,
            draw
        }
    });
}

/**
 * Handle return to waiting room
 * @param {Object} data - Message data
 */
function handleReturnToWaitingRoom(data) {
    const {playersCount, players} = data;
    const state = getState();

    // Update session in localStorage
    localStorage.setItem('bomberman-session', JSON.stringify({
        playerId: state.player.id,
        nickname: state.player.nickname
    }));

    // Return to waiting room
    setState({
        screen: 'waiting',
        waitingRoom: {
            players,
            countdown: null,
            playersCount,
            chatMessages: [] // Clear chat messages when returning to waiting room
        }
    });
}

/**
 * Handle chat message
 * @param {Object} data - Message data
 */
function handleChatMessage(data) {
    const {senderId, sender, message, timestamp} = data;
    const state = getState();
    const currentUserId = state.player.id;

    // Update state without triggering re-render
    if (state.screen === 'waiting') {
        const newMessages = [...(state.waitingRoom.chatMessages || []), data];
        state.waitingRoom.chatMessages = newMessages.slice(-50);
    } else if (state.screen === 'game') {
        const newMessages = [...(state.game.chatMessages || []), data];
        state.game.chatMessages = newMessages.slice(-50);
    }

    // Add to pending messages queue
    pendingMessages.push(data);

    // If update not already scheduled, schedule one
    if (!chatUpdateScheduled) {
        chatUpdateScheduled = true;
        requestAnimationFrame(() => {
            updateChatDOM();
            chatUpdateScheduled = false;
        });
    }
}

/**
 * Update chat DOM efficiently with all pending messages
 * Add this to your socket.js file
 */
function updateChatDOM() {
    if (pendingMessages.length === 0) return;

    const { screen, player } = getState();
    const currentUserId = player.id;

    // Get the right chat container
    let chatContainer;
    let containerId;
    if (screen === 'waiting') {
        containerId = 'chat-messages';
        chatContainer = document.getElementById(containerId);
    } else if (screen === 'game') {
        containerId = 'game-chat-messages';
        chatContainer = document.getElementById(containerId);
    }

    if (!chatContainer) return;

    optimizeChatContainer(containerId);
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();

    // Add all pending messages
    pendingMessages.forEach(msg => {
        const { senderId, sender, message: text, timestamp } = msg;

        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${senderId === currentUserId ? 'own' : ''}`;

        // Message header
        const headerEl = document.createElement('div');
        headerEl.className = 'message-header';

        const senderEl = document.createElement('span');
        senderEl.className = 'message-sender';
        senderEl.textContent = senderId === currentUserId ? 'You' : sender;

        const timeEl = document.createElement('span');
        timeEl.className = 'message-time';
        timeEl.textContent = new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        headerEl.appendChild(senderEl);
        headerEl.appendChild(timeEl);

        // Message content
        const contentEl = document.createElement('div');
        contentEl.className = 'message-content';
        contentEl.textContent = text;

        // Assemble message
        messageEl.appendChild(headerEl);
        messageEl.appendChild(contentEl);

        fragment.appendChild(messageEl);
    });

    // Append all messages at once
    chatContainer.appendChild(fragment);

    // Scroll to bottom if we were already at the bottom
    const isAtBottom = chatContainer.scrollHeight - chatContainer.clientHeight <= chatContainer.scrollTop + 10;
    if (isAtBottom) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Clear pending messages
    pendingMessages = [];
}

function handlePlayerMove(playerId, direction) {
    const state = getState();

    // Find the player element in the DOM
    const playerElement = document.querySelector(`[data-player-id="${playerId}"]`);

    if (!playerElement) return;

    // Current position
    const currentPlayer = state.game.players.find(p => p.id === playerId);
    if (!currentPlayer) return;

    // Calculate new position directly
    const cellSize = 40; // Cell size in pixels
    const newTop = `${currentPlayer.position.y * cellSize}px`;
    const newLeft = `${currentPlayer.position.x * cellSize}px`;

    // Update position with direct DOM manipulation (no re-rendering)
    playerElement.style.top = newTop;
    playerElement.style.left = newLeft;

    // Add movement animation class
    playerElement.classList.remove('moving-up', 'moving-down', 'moving-left', 'moving-right');
    playerElement.classList.add(`moving-${direction}`);

    // Remove animation class after it completes
    setTimeout(() => {
        if (playerElement.parentNode) { // Check if element still exists
            playerElement.classList.remove(`moving-${direction}`);
        }
    }, 200); // Match animation duration
}

// Track if each container already has animation prevention
const optimizedContainers = new Set();

/**
 * Optimize a chat container to prevent reflow animations on state updates
 * @param {string} containerId - ID of the chat container element
 */
function optimizeChatContainer(containerId) {
    // Only run once per container
    if (optimizedContainers.has(containerId)) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    console.log(`Optimizing chat container: ${containerId}`);

    // Add a class to prevent animation
    container.classList.add('optimize-animation');

    // Create a MutationObserver to detect when the chat is re-rendered
    const observer = new MutationObserver((mutations) => {
        // Wait for initial render to complete
        requestAnimationFrame(() => {
            // If messages were added/removed, preserve scroll position
            const isScrolledToBottom =
                container.scrollTop + container.clientHeight >= container.scrollHeight - 20;

            // Prevent animations on any re-rendered messages
            const messages = container.querySelectorAll('.chat-message');
            messages.forEach(msg => {
                msg.style.animation = 'none';
            });

            // Restore scroll position if at bottom
            if (isScrolledToBottom) {
                container.scrollTop = container.scrollHeight;
            }
        });
    });

    // Observe changes to the container's children
    observer.observe(container, { childList: true, subtree: true });

    // Remember that we've optimized this container
    optimizedContainers.add(containerId);
}



// Add this to socket.js - A more balanced optimization strategy

/**
 * Determine if a state update should trigger a re-render
 * @param {string} type - The type of update
 * @param {Object} data - The update data
 * @returns {boolean} True if should re-render
 */
function shouldTriggerRerender(type, data) {
    // Always re-render for these important events
    const importantEvents = [
        'PLAYER_JOINED',
        'PLAYER_LEFT',
        'GAME_COUNTDOWN_STARTED',
        'GAME_STARTED',
        'GAME_OVER',
        'RETURNED_TO_WAITING_ROOM'
    ];

    if (importantEvents.includes(type)) {
        return true;
    }

    // For game state updates, only re-render if something more than positions changed
    if (type === 'GAME_STATE_UPDATE') {
        const currentState = getState();

        // Check if bombs, powerups, or explosions changed
        if (!currentState.game) return true;

        const bombsChanged = data.state.bombs.length !== currentState.game.bombs.length;
        const powerUpsChanged = data.state.powerUps.length !== currentState.game.powerUps.length;
        const explosionsChanged = data.state.explosions.length !== currentState.game.explosions.length;

        // If any of these changed, re-render
        if (bombsChanged || powerUpsChanged || explosionsChanged) {
            return true;
        }

        // If only positions changed, don't re-render
        return false;
    }

    // Default to re-rendering
    return true;
}

// --- Solo Play Implementation ---
// Intercept WebSocket send to handle solo play requests
const originalSend = WebSocket.prototype.send;
WebSocket.prototype.send = function(data) {
    try {
        const message = JSON.parse(data);
        
        // Intercept START_SOLO_GAME messages and handle locally
        if (message.type === 'START_SOLO_GAME') {
            console.log('Starting solo game...');
            handleSoloGameStart();
            return; // Don't send to server
        }
        
        // If in solo mode, intercept game-related messages
        if (window.soloMode) {
            handleSoloGameMessage(message);
            return; // Don't send to server
        }
    } catch (e) {
        // Not JSON or other error, send as normal
    }
    
    // Call the original send method for all other messages
    return originalSend.call(this, data);
};

/**
 * Start a solo game
 */
function handleSoloGameStart() {
    const state = getState();
    const yourId = state.player.id;
    const yourNickname = state.player.nickname;
    
    // Set global solo mode flag
    window.soloMode = true;
    
    // Create a map for solo play
    const soloMap = {
        width: 15,
        height: 13,
        grid: generateSoloMap(15, 13)
    };
    
    // Create a game state with only the current player
    const gameState = {
        id: 'solo-' + Date.now(),
        map: soloMap,
        players: [{
            id: yourId,
            nickname: yourNickname,
            position: { x: 1, y: 1 },
            lives: 3,
            bombs: 1,
            flames: 1,
            speed: 1
        }],
        yourId: yourId,
        gameId: 'solo-' + Date.now()
    };
    
    // Initialize solo game state
    window.soloGameState = {
        map: soloMap,
        players: gameState.players,
        bombs: [],
        powerUps: [],
        explosions: [],
        gameOver: false
    };
    
    // Update game state to start the game
    setState({
        screen: 'game',
        game: {
            ...state.game,
            id: gameState.gameId,
            map: gameState.map,
            players: gameState.players,
            yourId: gameState.yourId,
            bombs: [],
            powerUps: [],
            explosions: [],
            chatMessages: state.waitingRoom.chatMessages || [] // Carry over chat messages
        }
    });
    initDirectControls();

    addAIEnemies();
    
    startSoloGameLoop();
}


function initDirectControls() {
    // Set up direct keyboard control for solo mode
    if (!window.directControlsInitialized) {
        console.log('Setting up direct keyboard controls for solo mode');
        
        document.addEventListener('keydown', function soloKeyHandler(e) {
            // Only handle in solo mode
            if (!window.soloMode) return;

            console.log('Solo mode key press detected:', e.key); // Add this line

            
            // Skip if we're typing in chat
            if (document.activeElement && 
                (document.activeElement.tagName === 'INPUT' || 
                 document.activeElement.tagName === 'TEXTAREA')) {
                return;
            }
            
            let direction = null;
            
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                    direction = 'up';
                    break;
                case 'ArrowDown':
                case 's':
                    direction = 'down';
                    break;
                case 'ArrowLeft':
                case 'a':
                    direction = 'left';
                    break;
                case 'ArrowRight':
                case 'd':
                    direction = 'right';
                    break;
                case ' ': // Spacebar
                    // Place bomb directly
                    handleSoloPlaceBomb();
                    e.preventDefault();
                    return;
            }
            
            if (direction) {
                handleSoloPlayerMove(direction);
                e.preventDefault();
            }
        });
        
        window.directControlsInitialized = true;
    }
}

/**
 * Generate a random map for solo play
 * @param {number} width - Map width
 * @param {number} height - Map height
 * @returns {Array} 2D grid array
 */
function generateSoloMap(width, height) {
    const grid = [];
    
    // Create empty grid
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            // 0 = empty, 1 = breakable block, 2 = wall
            if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                // Border walls
                row.push(2);
            } else if (x % 2 === 0 && y % 2 === 0) {
                // Inner walls
                row.push(2);
            } else if ((x === 1 && y === 1) || (x === 2 && y === 1) || (x === 1 && y === 2)) {
                // Starting area - keep it clear
                row.push(0);
            } else {
                // Random mix of empty spaces and breakable blocks
                row.push(Math.random() < 0.7 ? 1 : 0);
            }
        }
        grid.push(row);
    }
    
    return grid;
}

/**
 * Start the solo game loop
 */
function startSoloGameLoop() {
    // Clear any existing game loop
    if (window.soloGameLoopId) {
        clearInterval(window.soloGameLoopId);
    }
    
    // Run game logic every 100ms
    window.soloGameLoopId = setInterval(updateSoloGame, 100);
}

/**
 * Update the solo game state
 */
function updateSoloGame() {
    if (!window.soloMode || !window.soloGameState) return;
    
    const { map, players, bombs, powerUps, explosions } = window.soloGameState;
    
    // Check for bombs that need to explode
    const currentTime = Date.now();
    const bombsToExplode = bombs.filter(bomb => currentTime - bomb.placedAt >= 2000);
    
    // Explode bombs
    bombsToExplode.forEach(bomb => {
        // Remove the bomb
        window.soloGameState.bombs = bombs.filter(b => b.id !== bomb.id);
        
        // Get the player who placed the bomb
        const player = players.find(p => p.id === bomb.playerId);
        const range = player ? player.flames || 1 : 1;
        
        // Calculate explosion cells
        const explosionCells = calculateExplosionCells(map, bomb.x, bomb.y, range);
        
        // Create explosion
        const explosion = {
            id: bomb.id,
            cells: explosionCells,
            createdAt: currentTime
        };
        
        window.soloGameState.explosions.push(explosion);
        
        // Check for blocks to destroy
        explosionCells.forEach(cell => {
            if (isBlock(map, cell.x, cell.y)) {
                // Destroy the block
                map.grid[cell.y][cell.x] = 0;
                
                // Chance to spawn a power-up
                if (Math.random() < 0.3) {
                    spawnPowerUp(cell.x, cell.y);
                }
            }
        });
        
        // Check for players hit by explosion
        players.forEach(player => {
            if (player.lives <= 0) return; // Skip dead players
            
            const playerHit = explosionCells.some(cell => 
                cell.x === Math.floor(player.position.x) && 
                cell.y === Math.floor(player.position.y)
            );
            
            if (playerHit) {
                player.lives--;
                
                if (player.lives <= 0) {
                    // Player eliminated
                    console.log(`Player ${player.nickname} eliminated`);
                    
                    // Check if game is over (all players dead)
                    const alivePlayers = players.filter(p => p.lives > 0);
                    if (alivePlayers.length === 0) {
                        window.soloGameState.gameOver = true;
                        window.soloGameState.draw = true;
                    } else if (alivePlayers.length === 1) {
                        window.soloGameState.gameOver = true;
                        window.soloGameState.winner = alivePlayers[0];
                    }
                }
            }
        });
        
        // Play explosion sound
        playSound('/audio/explosion.wav', 0.6);
    });
    
    // Remove old explosions
    window.soloGameState.explosions = explosions.filter(explosion => 
        currentTime - explosion.createdAt < 1000
    );
    
    // Check for power-ups collected by players
    players.forEach(player => {
        if (player.lives <= 0) return; // Skip dead players
        
        const playerX = Math.floor(player.position.x);
        const playerY = Math.floor(player.position.y);
        
        const powerUpIndex = powerUps.findIndex(pu => 
            pu.x === playerX && pu.y === playerY
        );
        
        if (powerUpIndex !== -1) {
            const powerUp = powerUps[powerUpIndex];
            
            // Apply power-up effect
            switch (powerUp.type) {
                case 'bomb':
                    player.bombs = (player.bombs || 1) + 1;
                    break;
                case 'flame':
                    player.flames = (player.flames || 1) + 1;
                    break;
                case 'speed':
                    player.speed = (player.speed || 1) + 0.5;
                    break;
            }
            
            // Remove the power-up
            window.soloGameState.powerUps.splice(powerUpIndex, 1);
            
            // Play power-up sound
            playSound('/audio/powerup.wav', 0.5);
        }
    });


    updateAIEnemies();
    
    // Update the game state in the UI
    updateSoloGameUI();
    
    // Handle game over
    if (window.soloGameState.gameOver) {
        handleSoloGameOver();
    }
}

/**
 * Update the game UI to reflect solo game state
 */
function updateSoloGameUI() {
    
    const state = getState();
    
    // Only update if we're in game screen
    if (state.screen !== 'game') return;
    
    setState({
        game: {
            ...state.game,
            players: window.soloGameState.players,
            bombs: window.soloGameState.bombs,
            powerUps: window.soloGameState.powerUps,
            explosions: window.soloGameState.explosions,
            map: window.soloGameState.map,
            gameOver: window.soloGameState.gameOver,
            winner: window.soloGameState.winner,
            draw: window.soloGameState.draw
        }
    });
}

/**
 * Handle solo game messages
 * @param {Object} message - The message object
 */
function handleSoloGameMessage(message) {
    if (!window.soloMode || !window.soloGameState) return;
    
    switch (message.type) {
        case 'PLAYER_MOVE':
            handleSoloPlayerMove(message.direction);
            break;
            
        case 'PLACE_BOMB':
            handleSoloPlaceBomb();
            break;
            
        case 'CHAT':
            // Add local chat message
            const chatMessage = {
                senderId: getState().player.id,
                sender: getState().player.nickname,
                message: message.message,
                timestamp: Date.now()
            };
            
            const state = getState();
            setState({
                game: {
                    ...state.game,
                    chatMessages: [...state.game.chatMessages, chatMessage]
                }
            });
            break;
    }
}

/**
 * Handle player movement in solo mode
 * @param {string} direction - Movement direction ('up', 'down', 'left', 'right')
 */
function handleSoloPlayerMove(direction) {
    if (!window.soloMode || !window.soloGameState) {
        console.log('Solo mode or game state unavailable');
        return;
    }
    
    const player = window.soloGameState.players[0];
    if (!player) {
        console.log('Player not found in solo game state');
        return;
    }
    
    console.log('Moving player in direction:', direction);
    console.log('Current position:', player.position);
    
    // Use a fixed movement amount
    const moveAmount = 0.2;
    
    // Move player directly
    switch (direction) {
        case 'up':
            player.position.y -= moveAmount;
            break;
        case 'down':
            player.position.y += moveAmount;
            break;
        case 'left':
            player.position.x -= moveAmount;
            break;
        case 'right':
            player.position.x += moveAmount;
            break;
    }
    
    console.log('New position:', player.position);
    
    // Force a UI update
    updateSoloGameUI();
    
    // Also try direct DOM manipulation as a backup
    const playerElement = document.querySelector('[data-player-id="' + player.id + '"]');
    if (playerElement) {
        const cellSize = 40; // Cell size in pixels
        playerElement.style.top = `${player.position.y * cellSize}px`;
        playerElement.style.left = `${player.position.x * cellSize}px`;
        console.log('Updated player element position directly');
    } else {
        console.log('Player element not found in DOM');
    }
}

/**
 * Handle bomb placement in solo mode
 */
function handleSoloPlaceBomb() {
    const { players, bombs } = window.soloGameState;
    const player = players[0]; // In solo mode, the player is always the first one
    
    if (!player || player.lives <= 0) return;
    
    // Check if player has bombs left
    const activeBombs = bombs.filter(bomb => bomb.playerId === player.id).length;
    if (activeBombs >= (player.bombs || 1)) return;
    
    // Get player position (rounded to grid)
    const x = Math.floor(player.position.x);
    const y = Math.floor(player.position.y);
    
    // Check if there's already a bomb at this position
    if (bombs.some(bomb => bomb.x === x && bomb.y === y)) return;
    
    // Create a new bomb
    const bomb = {
        id: 'bomb-' + Date.now(),
        playerId: player.id,
        x,
        y,
        placedAt: Date.now()
    };
    
    // Add bomb to game state
    window.soloGameState.bombs.push(bomb);
    
    // Play bomb place sound
    playSound('/audio/bomb_place.wav', 0.5);
}

/**
 * Spawn a power-up at a specific position
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function spawnPowerUp(x, y) {
    // Determine power-up type randomly
    const types = ['bomb', 'flame', 'speed'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    // Create power-up
    const powerUp = {
        id: 'powerup-' + Date.now(),
        type: randomType,
        x,
        y
    };
    
    // Add to game state
    window.soloGameState.powerUps.push(powerUp);
}

/**
 * Handle solo game over
 */
function handleSoloGameOver() {
    // Stop the game loop
    if (window.soloGameLoopId) {
        clearInterval(window.soloGameLoopId);
        window.soloGameLoopId = null;
    }
    
    // Update UI with game over state
    const state = getState();
    setState({
        game: {
            ...state.game,
            gameOver: true,
            winner: window.soloGameState.winner,
            draw: window.soloGameState.draw
        }
    });
    
    // Return to waiting room after a delay
    setTimeout(() => {
        // Reset solo mode flag
        window.soloMode = false;
        window.soloGameState = null;
        
        // Return to waiting room
        const currentState = getState();
        setState({
            screen: 'waiting',
            waitingRoom: {
                players: [{
                    id: currentState.player.id,
                    nickname: currentState.player.nickname
                }],
                countdown: null,
                playersCount: 1,
                chatMessages: []
            }
        });
    }, 5000);
}

/**
 * Check if a position is valid for movement
 * @param {Object} map - Game map
 * @param {Array} bombs - Array of bombs
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if valid position
 */
function canMoveTo(map, bombs, x, y) {
    // Check map boundaries
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
        return false;
    }
    
    // Check walls and blocks
    if (map.grid[y][x] !== 0) {
        return false;
    }
    
    // Check bombs
    if (bombs.some(bomb => bomb.x === x && bomb.y === y)) {
        return false;
    }
    
    return true;
}

/**
 * Calculate explosion cells
 * @param {Object} map - Game map
 * @param {number} x - Bomb X coordinate
 * @param {number} y - Bomb Y coordinate
 * @param {number} range - Explosion range
 * @returns {Array} Array of cell coordinates affected by explosion
 */
function calculateExplosionCells(map, x, y, range) {
    const cells = [{ x, y }]; // Center of explosion
    
    // Directions: up, right, down, left
    const directions = [
        { dx: 0, dy: -1 }, // Up
        { dx: 1, dy: 0 },  // Right
        { dx: 0, dy: 1 },  // Down
        { dx: -1, dy: 0 }  // Left
    ];
    
    // Check each direction
    directions.forEach(dir => {
        for (let i = 1; i <= range; i++) {
            const newX = x + (dir.dx * i);
            const newY = y + (dir.dy * i);
            
            // Check boundaries
            if (newX < 0 || newY < 0 || newX >= map.width || newY >= map.height) {
                break;
            }
            
            // Stop if we hit a wall
            if (map.grid[newY][newX] === 2) {
                break;
            }
            
            // Add explosion cell
            cells.push({ x: newX, y: newY });
            
            // Stop at a block (but include it in explosion)
            if (map.grid[newY][newX] === 1) {
                break;
            }
        }
    });
    
    return cells;
}

/**
 * Check if a position contains a block
 * @param {Object} map - Game map
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if block
 */
function isBlock(map, x, y) {
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
        return false;
    }
    return map.grid[y][x] === 1;
}


/**
 * AI Enemies for Solo Mode
 * Add this code to your solo implementation in socket.js
 */

// Add this to your handleSoloGameStart function, right after initializing soloGameState
function addAIEnemies() {
    // Create 1-3 AI enemies based on random selection
    const enemyCount = 1 + Math.floor(Math.random() * 3); // 1 to 3 enemies

    console.log("Creating " + enemyCount + " AI enemies");

    
    for (let i = 0; i < enemyCount; i++) {
        // Find a valid spawn position away from the player
        const playerX = window.soloGameState.players[0].position.x;
        const playerY = window.soloGameState.players[0].position.y;
        const map = window.soloGameState.map;
        
        // Try to spawn AI at opposite corners or at least away from player
        let spawnX, spawnY;
        const cornerPositions = [
            { x: map.width - 2, y: map.height - 2 },  // Bottom right
            { x: map.width - 2, y: 1 },               // Top right 
            { x: 1, y: map.height - 2 }               // Bottom left
        ];
        
        // Try a corner position first
        const cornerPos = cornerPositions[i % cornerPositions.length];
        
        // Check if the corner is empty
        if (map.grid[cornerPos.y][cornerPos.x] === 0) {
            spawnX = cornerPos.x;
            spawnY = cornerPos.y;
        } else {
            // Find a random empty spot away from player
            let attempts = 0;
            do {
                spawnX = 1 + Math.floor(Math.random() * (map.width - 2));
                spawnY = 1 + Math.floor(Math.random() * (map.height - 2));
                attempts++;
                
                // Distance from player
                const distance = Math.sqrt(
                    Math.pow(spawnX - playerX, 2) + 
                    Math.pow(spawnY - playerY, 2)
                );
                
                // Accept if empty and far enough from player
                if (map.grid[spawnY][spawnX] === 0 && distance > 5) {
                    break;
                }
            } while (attempts < 50);
            
            // If we couldn't find a good spot, use a fallback
            if (attempts >= 50) {
                // Just use the first empty spot we can find
                for (let y = 1; y < map.height - 1; y++) {
                    for (let x = 1; x < map.width - 1; x++) {
                        if (map.grid[y][x] === 0 && 
                            (Math.abs(x - playerX) > 3 || Math.abs(y - playerY) > 3)) {
                            spawnX = x;
                            spawnY = y;
                            break;
                        }
                    }
                    if (spawnX && spawnY) break;
                }
            }
        }
        
        // Create AI with different difficulty levels
        const difficulty = i === 0 ? 'medium' : (i === 1 ? 'easy' : 'hard');
        const aiPlayer = {
            id: 'ai-' + (i + 1),
            nickname: getAINickname(difficulty),
            position: { x: spawnX, y: spawnY },
            lives: 1,
            bombs: 1,
            flames: 1 + Math.floor(i/2), // More flames for harder AIs
            speed: 1 + (i * 0.2),        // More speed for harder AIs
            isAI: true,
            difficulty: difficulty,
            lastMove: Date.now(),
            lastBomb: Date.now(),
            moveDelay: getAIMoveDelay(difficulty),
            bombDelay: getAIBombDelay(difficulty),
            targetPosition: null,
            state: 'roaming',     // roaming, hunting, fleeing
            fleeingFrom: null,
            pathfindingCache: {},
            lastAction: { type: null, direction: null, time: 0 }
        };

        console.log(`AI #${i+1} created: ${aiPlayer.nickname} (${aiPlayer.difficulty}) at position ${spawnX},${spawnY}`);

        
        // Add to the players array
        window.soloGameState.players.push(aiPlayer);
    }
    
    console.log(`Added ${enemyCount} AI enemies to solo mode`);
}

// Helper function to get a random AI nickname based on difficulty
function getAINickname(difficulty) {
    const easyNames = ['Rookie', 'Newbie', 'Trainee', 'Beginner'];
    const mediumNames = ['Hunter', 'Chaser', 'Stalker', 'Shadow'];
    const hardNames = ['Assassin', 'Terminator', 'Predator', 'Destroyer'];
    
    let nameList;
    switch (difficulty) {
        case 'easy': nameList = easyNames; break;
        case 'hard': nameList = hardNames; break;
        default: nameList = mediumNames;
    }
    
    return nameList[Math.floor(Math.random() * nameList.length)];
}

// Helper to get AI move delay based on difficulty
function getAIMoveDelay(difficulty) {
    switch (difficulty) {
        case 'easy': return 800; // Slower movements
        case 'hard': return 400; // Faster movements
        default: return 600;     // Medium speed
    }
}

// Helper to get AI bomb delay based on difficulty
function getAIBombDelay(difficulty) {
    switch (difficulty) {
        case 'easy': return 5000;   // Drops bombs less frequently
        case 'hard': return 2000;   // Drops bombs more frequently
        default: return 3000;       // Medium frequency
    }
}

// Add AI update function to updateSoloGame
function updateAIEnemies() {

    console.log("Updating AI enemies...");

    if (!window.soloMode || !window.soloGameState) {
        console.log("Solo mode or game state not available");
        return;
    }
    
    const { players, map, bombs, explosions } = window.soloGameState;
    const humanPlayer = players.find(p => !p.isAI);
    const aiPlayers = players.filter(p => p.isAI && p.lives > 0);

    console.log(`Found ${aiPlayers.length} active AI players`);
    
    if (!humanPlayer || humanPlayer.lives <= 0) return; // No point updating AI if human is dead
    
    const currentTime = Date.now();
    
    // Update each AI
    aiPlayers.forEach(ai => {
        // Check if it's time to move
        if (currentTime - ai.lastMove >= ai.moveDelay) {
            updateAIState(ai, humanPlayer, map, bombs, explosions);
            
            // Movement logic based on state
            if (ai.state === 'fleeing') {
                moveAwayFromDanger(ai);
            } else if (ai.state === 'hunting') {
                moveTowardTarget(ai, humanPlayer.position);
            } else {
                // Roaming - move randomly but intelligently
                moveRandomly(ai);
            }
            
            ai.lastMove = currentTime;
        }
        
        // Check if it's time to place a bomb
        if (currentTime - ai.lastBomb >= ai.bombDelay) {
            const shouldPlaceBomb = decideToBomb(ai, humanPlayer, map, bombs);
            
            if (shouldPlaceBomb) {
                placeAIBomb(ai);
                ai.lastBomb = currentTime;
            }
        }
    });
}

// Update AI state based on game situation
function updateAIState(ai, player, map, bombs, explosions) {
    // Check if in danger (near bombs or explosions)
    const inDanger = isInDanger(ai, bombs, explosions);
    
    if (inDanger) {
        // Switch to fleeing state
        ai.state = 'fleeing';
        ai.fleeingFrom = inDanger.source;
        
        // Fleeing has higher priority, return early
        return;
    }
    
    // If not in danger, decide between hunting and roaming
    const distanceToPlayer = getDistance(ai.position, player.position);
    const difficulty = ai.difficulty;
    
    // Decide based on difficulty and distance
    if (difficulty === 'hard' || 
       (difficulty === 'medium' && distanceToPlayer < 5) ||
       (difficulty === 'easy' && distanceToPlayer < 3)) {
        // Hunt the player
        ai.state = 'hunting';
        ai.targetPosition = player.position;
    } else {
        // Just roam around
        ai.state = 'roaming';
        ai.targetPosition = null;
    }
}

// Check if AI is in danger from bombs or explosions
function isInDanger(ai, bombs, explosions) {
    const aiX = Math.floor(ai.position.x);
    const aiY = Math.floor(ai.position.y);
    
    // Check explosions first
    for (const explosion of explosions) {
        for (const cell of explosion.cells) {
            // If explosion is at AI position or 1 cell away
            if ((cell.x === aiX && cell.y === aiY) ||
                (Math.abs(cell.x - aiX) <= 1 && cell.y === aiY) ||
                (Math.abs(cell.y - aiY) <= 1 && cell.x === aiX)) {
                    return { type: 'explosion', source: cell };
            }
        }
    }
    
    // Check bombs
    for (const bomb of bombs) {
        // Predict explosion range (simple approximation)
        const range = 2; // Assume a reasonable blast radius
        
        // Check if AI is in likely blast zone
        if ((bomb.x === aiX && Math.abs(bomb.y - aiY) <= range) ||
            (bomb.y === aiY && Math.abs(bomb.x - aiX) <= range)) {
            return { type: 'bomb', source: bomb };
        }
    }
    
    return null;
}

// Move AI away from danger
function moveAwayFromDanger(ai) {
    const danger = ai.fleeingFrom;
    if (!danger) return;
    
    const aiX = Math.floor(ai.position.x);
    const aiY = Math.floor(ai.position.y);
    const dangerX = danger.x || aiX;
    const dangerY = danger.y || aiY;
    
    // Find the best direction to move (away from danger)
    const directions = [
        { x: 0, y: -1, name: 'up' },
        { x: 1, y: 0, name: 'right' },
        { x: 0, y: 1, name: 'down' },
        { x: -1, y: 0, name: 'left' }
    ];
    
    // Shuffle directions for some randomness
    shuffleArray(directions);
    
    let bestDirection = null;
    let bestDistance = -1;
    
    for (const dir of directions) {
        const newX = aiX + dir.x;
        const newY = aiY + dir.y;
        
        // Skip if not a valid move
        if (!canAIMoveTo(newX, newY)) continue;
        
        // Calculate distance from danger after this move
        const newDistance = getDistance({ x: newX, y: newY }, { x: dangerX, y: dangerY });
        
        // Better if it increases distance from danger
        if (newDistance > bestDistance) {
            bestDistance = newDistance;
            bestDirection = dir;
        }
    }
    
    // Move in the best direction if found
    if (bestDirection) {
        moveAI(ai, bestDirection.name);
    }
}

// Move AI toward target position
function moveTowardTarget(ai, targetPos) {
    const aiX = Math.floor(ai.position.x);
    const aiY = Math.floor(ai.position.y);
    const targetX = Math.floor(targetPos.x);
    const targetY = Math.floor(targetPos.y);
    
    // Already at target
    if (aiX === targetX && aiY === targetY) return;
    
    // Simple A* pathfinding
    const path = findPath(ai, { x: aiX, y: aiY }, { x: targetX, y: targetY });
    
    if (path && path.length > 1) {
        // First element is current position, second is next step
        const nextStep = path[1];
        
        // Determine direction to move
        if (nextStep.x > aiX) moveAI(ai, 'right');
        else if (nextStep.x < aiX) moveAI(ai, 'left');
        else if (nextStep.y > aiY) moveAI(ai, 'down');
        else if (nextStep.y < aiY) moveAI(ai, 'up');
    } else {
        // No path found, move randomly
        moveRandomly(ai);
    }
}

// Move AI randomly but intelligently
// Replace the entire moveRandomly function with this simpler version:
function moveRandomly(ai) {
    // Pick a random direction
    const directions = ['up', 'right', 'down', 'left'];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    
    // Get current position
    const aiX = Math.floor(ai.position.x);
    const aiY = Math.floor(ai.position.y);
    
    // Calculate new position
    let newX = aiX;
    let newY = aiY;
    
    if (randomDirection === 'up') newY--;
    else if (randomDirection === 'down') newY++;
    else if (randomDirection === 'left') newX--;
    else if (randomDirection === 'right') newX++;
    
    // Only move if valid
    if (canAIMoveTo(newX, newY)) {
        console.log(`AI ${ai.nickname} moving ${randomDirection}`);
        moveAI(ai, randomDirection);
    } else {
        console.log(`AI ${ai.nickname} can't move ${randomDirection}`);
    }
}



// Decide if AI should place a bomb
function decideToBomb(ai, player, map, bombs) {
    const aiX = Math.floor(ai.position.x);
    const aiY = Math.floor(ai.position.y);
    const playerX = Math.floor(player.position.x);
    const playerY = Math.floor(player.position.y);
    
    // Don't bomb if already a bomb here
    if (bombs.some(b => b.x === aiX && b.y === aiY)) {
        return false;
    }
    
    // Check if the player is in the same row or column (potential hit)
    const inSameRow = aiY === playerY && Math.abs(aiX - playerX) <= ai.flames;
    const inSameCol = aiX === playerX && Math.abs(aiY - playerY) <= ai.flames;
    
    // Check for destructible blocks around
    const hasBlockNearby = hasDestructibleBlockNearby(aiX, aiY);
    
    // Calculate bomb probability based on difficulty and situation
    let bombChance = 0;
    
    // Aggressive if player is in bombing range
    if (inSameRow || inSameCol) {
        bombChance += 0.7;
    }
    
    // More likely to bomb if blocks nearby
    if (hasBlockNearby) {
        bombChance += 0.3;
    }
    
    // Adjust based on difficulty
    if (ai.difficulty === 'hard') bombChance += 0.2;
    if (ai.difficulty === 'easy') bombChance -= 0.3;
    
    // Don't bomb if we're in a corner or trapped
    const movableDirections = countMovableDirections(aiX, aiY);
    if (movableDirections <= 1) {
        bombChance -= 0.7;
    }
    
    // Make the decision
    return Math.random() < bombChance;
}

// Place a bomb at AI's position
function placeAIBomb(ai) {
    const { bombs } = window.soloGameState;
    const aiX = Math.floor(ai.position.x);
    const aiY = Math.floor(ai.position.y);
    
    // Check if there's already a bomb here
    if (bombs.some(bomb => bomb.x === aiX && bomb.y === aiY)) {
        return;
    }
    
    // Check if AI has any bombs left
    const activeBombs = bombs.filter(bomb => bomb.playerId === ai.id).length;
    if (activeBombs >= (ai.bombs || 1)) {
        return;
    }
    
    // Create new bomb
    const bomb = {
        id: 'ai-bomb-' + Date.now(),
        playerId: ai.id,
        x: aiX,
        y: aiY,
        placedAt: Date.now()
    };
    
    // Add to game state
    window.soloGameState.bombs.push(bomb);
    
    // Update AI state to fleeing
    ai.state = 'fleeing';
    ai.fleeingFrom = bomb;
    
    // Play sound
    playSound('/audio/bomb_place.wav', 0.4);
    
    // Update AI's last action
    ai.lastAction = {
        type: 'bomb',
        time: Date.now()
    };
}

// Move AI in a specific direction
function moveAI(ai, direction) {
    const speed = 0.2 * (ai.speed || 1);
    const originalX = ai.position.x;
    const originalY = ai.position.y;
    
    switch (direction) {
        case 'up':
            ai.position.y -= speed;
            break;
        case 'down':
            ai.position.y += speed;
            break;
        case 'left':
            ai.position.x -= speed;
            break;
        case 'right':
            ai.position.x += speed;
            break;
    }
    
    console.log(`AI ${ai.nickname} moved ${direction} from (${originalX.toFixed(2)},${originalY.toFixed(2)}) to (${ai.position.x.toFixed(2)},${ai.position.y.toFixed(2)})`);
    
    // Update AI's last action
    ai.lastAction = {
        type: 'move',
        direction: direction,
        time: Date.now()
    };
}

// Check if AI can move to a specific position
function canAIMoveTo(x, y) {
    const { map, bombs } = window.soloGameState;
    
    // Check map boundaries
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
        return false;
    }
    
    // Check walls and blocks
    if (map.grid[y][x] !== 0) {
        return false;
    }
    
    // Check bombs
    if (bombs.some(bomb => bomb.x === x && bomb.y === y)) {
        return false;
    }
    
    return true;
}

// Count how many directions AI can move
function countMovableDirections(x, y) {
    let count = 0;
    
    if (canAIMoveTo(x, y-1)) count++; // Up
    if (canAIMoveTo(x+1, y)) count++; // Right
    if (canAIMoveTo(x, y+1)) count++; // Down
    if (canAIMoveTo(x-1, y)) count++; // Left
    
    return count;
}

// Check if there are destructible blocks nearby
function hasDestructibleBlockNearby(x, y) {
    const { map } = window.soloGameState;
    
    // Check in all 4 directions
    return (
        (y > 0 && map.grid[y-1][x] === 1) ||     // Up
        (x < map.width-1 && map.grid[y][x+1] === 1) || // Right
        (y < map.height-1 && map.grid[y+1][x] === 1) || // Down
        (x > 0 && map.grid[y][x-1] === 1)        // Left
    );
}

// Calculate distance between two points
function getDistance(pos1, pos2) {
    return Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) + 
        Math.pow(pos1.y - pos2.y, 2)
    );
}

// Simple A* pathfinding algorithm
function findPath(ai, start, goal) {
    // Check cache first (performance optimization)
    const cacheKey = `${start.x},${start.y}-${goal.x},${goal.y}`;
    
    if (ai.pathfindingCache[cacheKey] && 
        Date.now() - ai.pathfindingCache[cacheKey].time < 1000) {
        return ai.pathfindingCache[cacheKey].path;
    }
    
    const { map, bombs } = window.soloGameState;
    
    // If more than 10 cells away, use simple direct approach (performance)
    if (Math.abs(start.x - goal.x) + Math.abs(start.y - goal.y) > 10) {
        // Just try to move on X or Y axis toward goal
        const path = [start];
        let current = { ...start };
        
        // Max 5 steps for simplified path
        for (let i = 0; i < 5; i++) {
            // Decide whether to move X or Y
            const moveX = Math.abs(current.x - goal.x) > Math.abs(current.y - goal.y);
            
            if (moveX) {
                current = {
                    x: current.x + (current.x < goal.x ? 1 : -1),
                    y: current.y
                };
            } else {
                current = {
                    x: current.x,
                    y: current.y + (current.y < goal.y ? 1 : -1)
                };
            }
            
            // Stop if hit wall
            if (!canAIMoveTo(current.x, current.y)) break;
            
            path.push(current);
            
            // Check if we've reached the goal
            if (current.x === goal.x && current.y === goal.y) break;
        }
        
        // Cache the result
        ai.pathfindingCache[cacheKey] = {
            path: path,
            time: Date.now()
        };
        
        return path;
    }
    
    // For full A*, implement as needed for better pathfinding
    // Simple implementation here just returns direct path if possible
    const path = [start];
    
    // Try horizontal first, then vertical
    let current = { ...start };
    
    // Move horizontally
    while (current.x !== goal.x) {
        const nextX = current.x + (current.x < goal.x ? 1 : -1);
        if (!canAIMoveTo(nextX, current.y)) break;
        
        current = { x: nextX, y: current.y };
        path.push({ ...current });
    }
    
    // Then move vertically
    while (current.y !== goal.y) {
        const nextY = current.y + (current.y < goal.y ? 1 : -1);
        if (!canAIMoveTo(current.x, nextY)) break;
        
        current = { x: current.x, y: nextY };
        path.push({ ...current });
    }
    
    // Cache the result
    ai.pathfindingCache[cacheKey] = {
        path: path,
        time: Date.now()
    };
    
    return path;
}

// Shuffle array helper (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}




