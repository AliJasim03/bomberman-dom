/**
 * Bomberman DOM - Main Client Application
 */
import {
    createApp,
    setState,
    getState,
    createElement
} from '../../src/index.js';

import { initSocket } from './socket.js';
import LoginScreen from './components/LoginScreen.js';
import WaitingRoom from './components/WaitingRoom.js';
import Game from './components/Game.js';

// Initialize application state
setState({
    screen: 'login',
    reconnecting: false,
    player: {
        id: null,
        nickname: '',
    },
    waitingRoom: {
        players: [],
        countdown: null,
        playersCount: 0,
        chatMessages: []
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
        fps: 0
    }
});

// Try to restore session from localStorage
try {
    const savedSession = localStorage.getItem('bomberman-session');
    if (savedSession) {
        const sessionData = JSON.parse(savedSession);

        if (sessionData.nickname && sessionData.playerId) {
            console.log('Found saved session:', sessionData);

            // Update player state with saved data
            setState({
                reconnecting: true,
                player: {
                    ...getState().player,
                    id: sessionData.playerId,
                    nickname: sessionData.nickname
                }
            });

            // We'll send the reconnection request after socket is initialized
        }
    }
} catch (error) {
    console.error('Error restoring session:', error);
    localStorage.removeItem('bomberman-session');
}

// Initialize WebSocket connection
initSocket();

// Function to attempt reconnection
export function attemptReconnect() {
    const state = getState();
    if (state.reconnecting && state.player.id && state.player.nickname) {
        console.log('Attempting to reconnect with ID:', state.player.id);

        if (window.socket && window.socket.readyState === WebSocket.OPEN) {
            window.socket.send(JSON.stringify({
                type: 'RECONNECT',
                playerId: state.player.id,
                nickname: state.player.nickname
            }));
        } else {
            console.log('Socket not ready yet for reconnection');
            // We'll try again when the socket is open (handled in socket.js)
        }
    }
}

// Root App Component
function App(state) {
    // Ensure we have state
    if (!state) {
        console.error('No state available in App component');
        return createElement('div', {}, ['Loading...']);
    }

    // Return different screens based on the current state
    switch (state.screen) {
        case 'login':
            return LoginScreen();
        case 'waiting':
            return WaitingRoom();
        case 'game':
            return Game();
        case 'error':
            return createElement('div', { class: 'error-container' }, [
                createElement('div', { class: 'error-message' }, [
                    state.error || 'An error occurred'
                ]),
                createElement('button', {
                    class: 'refresh-button',
                    onClick: () => window.location.reload()
                }, ['Refresh Page'])
            ]);
        default:
            return LoginScreen();
    }
}

// Create and mount the app
const app = createApp(App);

// Add keyboard event listeners for game controls
document.addEventListener('keydown', (e) => {
    const { screen } = getState();

    // Only handle keyboard input in game screen
    if (screen !== 'game') return;

    const { socket } = window;
    if (!socket) return;

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
            socket.send(JSON.stringify({ type: 'PLAYER_MOVE', direction: 'up' }));
            break;
        case 'ArrowDown':
        case 's':
            socket.send(JSON.stringify({ type: 'PLAYER_MOVE', direction: 'down' }));
            break;
        case 'ArrowLeft':
        case 'a':
            socket.send(JSON.stringify({ type: 'PLAYER_MOVE', direction: 'left' }));
            break;
        case 'ArrowRight':
        case 'd':
            socket.send(JSON.stringify({ type: 'PLAYER_MOVE', direction: 'right' }));
            break;
        case ' ': // Space bar
            socket.send(JSON.stringify({ type: 'PLACE_BOMB' }));
            break;
    }
});