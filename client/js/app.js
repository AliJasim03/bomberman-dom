/**
 * Bomberman DOM - Main Client Application
 * Uses mini-framework for rendering and state management
 */
import {
    createApp,
    setState,
    getState,
    Router
} from '../../src/index.js';

import { initSocket } from './socket.js';
import LoginScreen from './components/LoginScreen.js';
import WaitingRoom from './components/WaitingRoom.js';
import Game from './components/Game.js';

// Initialize application state
setState({
    screen: 'login',
    player: {
        id: null,
        nickname: '',
    },
    waitingRoom: {
        players: [],
        countdown: null,
    },
    game: {
        id: null,
        players: [],
        map: null,
        bombs: [],
        powerUps: [],
        explosions: [],
        chatMessages: [],
    },
    performance: {
        fps: 0,
        lastFrameTime: 0,
        frameCount: 0,
        lastFpsUpdate: 0,
    }
});

// Initialize WebSocket connection
initSocket();

// Set up router for different screens
const router = new Router([
    { path: '/', component: () => {
            const { screen } = getState();

            switch (screen) {
                case 'login':
                    return LoginScreen;
                case 'waiting':
                    return WaitingRoom;
                case 'game':
                    return Game;
                default:
                    return LoginScreen;
            }
        }}
]);

// Create performance monitoring
function updatePerformance(timestamp) {
    const state = getState();
    const perf = state.performance;

    // Skip first frame
    if (perf.lastFrameTime === 0) {
        setState({
            performance: {
                ...perf,
                lastFrameTime: timestamp,
                lastFpsUpdate: timestamp
            }
        });
        requestAnimationFrame(updatePerformance);
        return;
    }

    // Calculate time since last frame
    const deltaTime = timestamp - perf.lastFrameTime;

    // Increment frame counter
    perf.frameCount++;

    // Update FPS counter once per second
    if (timestamp - perf.lastFpsUpdate >= 1000) {
        const fps = Math.round((perf.frameCount * 1000) / (timestamp - perf.lastFpsUpdate));

        setState({
            performance: {
                ...perf,
                fps,
                frameCount: 0,
                lastFpsUpdate: timestamp
            }
        });
    }

    // Store last frame time
    setState({
        performance: {
            ...getState().performance,
            lastFrameTime: timestamp
        }
    });

    // Continue animation loop
    requestAnimationFrame(updatePerformance);
}

// Start performance monitoring
requestAnimationFrame(updatePerformance);

// Create and mount the app
const app = createApp(() => router.getCurrentComponent()());

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