/**
 * WebSocket client for Bomberman DOM
 * Handles all communication with the server
 */
import { getState, setState } from '../../src/index.js';

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
    const { type } = data;

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
            handleChatMessage(data);(data);
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
}

/**
 * Handle successful login
 * @param {Object} data - Message data
 */
function handleJoinSuccess(data) {
    const { id, playersCount, players } = data;

    // Update player information
    setState({
        screen: 'waiting',
        player: {
            ...getState().player,
            id
        },
        waitingRoom: {
            players,
            countdown: null,
            playersCount
        }
    });
}

/**
 * Handle error messages
 * @param {Object} data - Message data
 */
function handleError(data) {
    const { message } = data;

    // Show error message
    alert(`Error: ${message}`);
}

/**
 * Handle new player joining the waiting room
 * @param {Object} data - Message data
 */
function handlePlayerJoined(data) {
    const { player, playersCount } = data;
    const state = getState();

    // Add player to waiting room
    setState({
        waitingRoom: {
            ...state.waitingRoom,
            players: [...state.waitingRoom.players, player],
            playersCount
        }
    });
}

/**
 * Handle player leaving the waiting room
 * @param {Object} data - Message data
 */
function handlePlayerLeft(data) {
    const { playerId, playersCount } = data;
    const state = getState();

    // Remove player from waiting room
    setState({
        waitingRoom: {
            ...state.waitingRoom,
            players: state.waitingRoom.players.filter(p => p.id !== playerId),
            playersCount
        }
    });
}

/**
 * Handle waiting period started
 * @param {Object} data - Message data
 */
function handleWaitingPeriod(data) {
    const { seconds } = data;
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
    const { seconds } = data;
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
    const { seconds } = data;
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
    const { gameId, map, players, yourId } = data;
    const state = getState();

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
    const { state: gameState } = data;
    const state = getState();

    // Update game state
    setState({
        game: {
            ...state.game,
            players: gameState.players,
            bombs: gameState.bombs,
            powerUps: gameState.powerUps
        }
    });
}

/**
 * Handle bomb placed
 * @param {Object} data - Message data
 */
function handleBombPlaced(data) {
    const { bomb } = data;
    const state = getState();

    // Add bomb to game state
    setState({
        game: {
            ...state.game,
            bombs: [...state.game.bombs, bomb]
        }
    });
}

/**
 * Handle bomb exploded
 * @param {Object} data - Message data
 */
function handleBombExploded(data) {
    const { bombId, explosionCells } = data;
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

    // Remove explosion after animation completes (1 second)
    setTimeout(() => {
        const currentState = getState();
        setState({
            game: {
                ...currentState.game,
                explosions: currentState.game.explosions.filter(e => e.id !== bombId)
            }
        });
    }, 1000);
}

/**
 * Handle block destroyed
 * @param {Object} data - Message data
 */
function handleBlockDestroyed(data) {
    const { position } = data;
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
    const { powerUp } = data;
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
    const { powerUpId } = data;
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
    const { playerId, livesLeft } = data;
    const state = getState();

    // Update player lives
    const players = state.game.players.map(player =>
        player.id === playerId
            ? { ...player, lives: livesLeft }
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
    const { playerId } = data;
    const state = getState();

    // Update player status
    const players = state.game.players.map(player =>
        player.id === playerId
            ? { ...player, lives: 0, eliminated: true }
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
    const { playerId } = data;
    const state = getState();

    // Update player status
    const players = state.game.players.map(player =>
        player.id === playerId
            ? { ...player, lives: 0, disconnected: true }
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
    const { winner, draw } = data;
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
    const { playersCount, players } = data;

    // Return to waiting room
    setState({
        screen: 'waiting',
        waitingRoom: {
            players,
            countdown: null,
            playersCount
        }
    });
}

/**
 * Handle chat message directly without full re-render
 * @param {Object} data - Message data
 */
function handleChatMessage(data) {
    const { senderId, sender, message, timestamp } = data;
    const state = getState();
    const currentUserId = state.player.id;

    // Create chat message element
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
    timeEl.textContent = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    headerEl.appendChild(senderEl);
    headerEl.appendChild(timeEl);

    // Message content
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    contentEl.textContent = message;

    // Assemble message
    messageEl.appendChild(headerEl);
    messageEl.appendChild(contentEl);

    // Add to appropriate chat container
    let chatContainer;
    if (state.screen === 'waiting') {
        chatContainer = document.getElementById('chat-messages');

        // Also update state (but don't trigger re-render)
        const newMessages = [...(state.waitingRoom.chatMessages || []), data];
        state.waitingRoom.chatMessages = newMessages.slice(-50);
    } else if (state.screen === 'game') {
        chatContainer = document.getElementById('game-chat-messages');

        // Also update state (but don't trigger re-render)
        const newMessages = [...(state.game.chatMessages || []), data];
        state.game.chatMessages = newMessages.slice(-50);
    }

    if (chatContainer) {
        chatContainer.appendChild(messageEl);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}