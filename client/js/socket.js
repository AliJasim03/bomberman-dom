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