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

// Performance monitoring
let lastFrameTime = 0;
let frames = 0;
let fps = 0;

// Create FPS counter element
const fpsCounter = document.createElement('div');
fpsCounter.id = 'fps-counter';
fpsCounter.style.position = 'fixed';
fpsCounter.style.top = '10px';
fpsCounter.style.right = '10px';
fpsCounter.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
fpsCounter.style.color = 'white';
fpsCounter.style.padding = '5px 10px';
fpsCounter.style.borderRadius = '5px';
fpsCounter.style.fontSize = '14px';
fpsCounter.style.zIndex = '9999';
document.body.appendChild(fpsCounter);

// Function to update FPS counter
function updateFPS(timestamp) {
    frames++;

    if (timestamp - lastFrameTime >= 1000) {
        fps = frames;
        frames = 0;
        lastFrameTime = timestamp;

        fpsCounter.textContent = `FPS: ${fps}`;

        // Update color based on performance
        if (fps >= 55) {
            fpsCounter.style.color = '#2ecc71'; // Green for good
        } else if (fps >= 30) {
            fpsCounter.style.color = '#f39c12'; // Orange for ok
        } else {
            fpsCounter.style.color = '#e74c3c'; // Red for poor
        }
    }

    requestAnimationFrame(updateFPS);
}

// Start FPS monitoring
requestAnimationFrame(updateFPS);

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