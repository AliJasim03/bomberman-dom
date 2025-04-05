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
import { preloadAllGameSounds, playSound } from '../utils/audio.js';

// Asset cache for faster image loading
window.assetCache = {
    images: {},
    audio: {}
};

// Performance monitoring variables
let lastFrameTime = 0;
let lastUpdateTime = 0;
let frames = 0;
let fps = 0;
const UPDATE_INTERVAL = 16.67; // Target ~60fps (1000ms / 60)

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

// Preload all game sounds immediately
preloadAllGameSounds();

// Function to preload game assets
function preloadGameAssets() {
    console.log("Preloading game assets...");

    // Preload images
    const imageAssets = [
        '/assets/images/bombs/bomb.png',
        '/assets/images/bombs/explosion.png',
        '/assets/images/map/floor.png',
        '/assets/images/map/wall.png',
        '/assets/images/map/block.png',
        '/assets/images/players/player1.png',
        '/assets/images/players/player2.png',
        '/assets/images/players/player3.png',
        '/assets/images/players/player4.png',
        '/assets/images/players/player5.png',
        '/assets/images/players/player6.png',
        '/assets/images/powerups/bomb_powerup.png',
        '/assets/images/powerups/flame_powerup.png',
        '/assets/images/powerups/speed_powerup.png',
        '/assets/images/ui/heart.png',
        '/assets/images/ui/heart-empty.png'
    ];

    // Cache images
    imageAssets.forEach(src => {
        const img = new Image();
        img.onload = () => console.log(`Loaded image: ${src}`);
        img.onerror = () => {
            console.error(`Failed to load image: ${src}`);
            // Try alternate path if original fails
            if (!src.includes('/assets/')) {
                const alternateSrc = src.replace('/assets/', '/');
                const altImg = new Image();
                altImg.src = alternateSrc;
                window.assetCache.images[src] = altImg;
            }
        };
        img.src = src;
        window.assetCache.images[src] = img;
    });
}

// Optimized game loop function
function gameLoop(timestamp) {
    // Store reference to cancel if needed
    window.animationFrameId = requestAnimationFrame(gameLoop);

    // Calculate FPS
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

        // Store FPS in state for other components
        const state = getState();
        if (state.performance) {
            state.performance.fps = fps;
        }
    }

    // Only update game animations at fixed intervals
    if (timestamp - lastUpdateTime >= UPDATE_INTERVAL) {
        lastUpdateTime = timestamp;

        // If we're in game screen, update animations
        const { screen } = getState();
        if (screen === 'game') {
            updateGameAnimations(timestamp);
        }
    }
}

// Function to update game animations without re-rendering
function updateGameAnimations(timestamp) {
    const { game } = getState();
    if (!game) return;

    const { bombs = [], explosions = [] } = game;

    // Update bomb animations
    bombs.forEach(bomb => {
        const bombEl = document.querySelector(`[data-bomb-id="${bomb.id}"]`);
        if (bombEl) {
            const timeLeft = 2000 - (timestamp - bomb.placedAt);

            // Change animation based on time left
            if (timeLeft < 500 && !bombEl.classList.contains('about-to-explode')) {
                bombEl.classList.add('about-to-explode');
            }
        }
    });

    // Update explosion animations - check for old explosions
    explosions.forEach(explosion => {
        const created = explosion.createdAt;
        const age = timestamp - created;

        // Remove explosion elements if they're old (over 1000ms)
        if (age > 1000) {
            const explosionElements = document.querySelectorAll(`[data-explosion-id="${explosion.id}"]`);
            explosionElements.forEach(el => {
                if (el && el.parentNode) {
                    el.style.opacity = '0';
                    setTimeout(() => {
                        if (el.parentNode) el.parentNode.removeChild(el);
                    }, 100);
                }
            });

            // Update state to remove old explosions
            const { game } = getState();
            if (game && game.explosions) {
                game.explosions = game.explosions.filter(e => e.id !== explosion.id);
            }
        }
    });

    // Update power-up animations
    const powerUpElements = document.querySelectorAll('.power-up');
    powerUpElements.forEach(el => {
        // Apply subtle animation by manipulating the transform directly
        const time = timestamp % 2000 / 2000;
        const y = Math.sin(time * Math.PI * 2) * 5;
        el.style.transform = `translateY(${y}px) translateZ(0)`;
    });
}

// Function to clean up resources when changing screens
function cleanupResources() {
    // Cancel animation frame
    if (window.animationFrameId) {
        cancelAnimationFrame(window.animationFrameId);
        window.animationFrameId = null;
    }

    // Stop any sounds
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
}

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

// Optimized keyboard input handling with key state tracking
const keyState = {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false
};

// Track key state changes
document.addEventListener('keydown', (e) => {
    const { screen } = getState();

    // Only handle keyboard input in game screen
    if (screen !== 'game') return;

    // Prevent default for game controls to avoid scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
    }

    const { socket } = window;
    if (!socket) return;

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
            if (!keyState.up) {
                keyState.up = true;
                socket.send(JSON.stringify({ type: 'PLAYER_MOVE', direction: 'up' }));
            }
            break;
        case 'ArrowDown':
        case 's':
            if (!keyState.down) {
                keyState.down = true;
                socket.send(JSON.stringify({ type: 'PLAYER_MOVE', direction: 'down' }));
            }
            break;
        case 'ArrowLeft':
        case 'a':
            if (!keyState.left) {
                keyState.left = true;
                socket.send(JSON.stringify({ type: 'PLAYER_MOVE', direction: 'left' }));
            }
            break;
        case 'ArrowRight':
        case 'd':
            if (!keyState.right) {
                keyState.right = true;
                socket.send(JSON.stringify({ type: 'PLAYER_MOVE', direction: 'right' }));
            }
            break;
        case ' ': // Space bar
            if (!keyState.space) {
                keyState.space = true;
                socket.send(JSON.stringify({ type: 'PLACE_BOMB' }));
                // Play bomb place sound
                playSound('/audio/bomb_place.wav', 0.5);
            }
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
            keyState.up = false;
            break;
        case 'ArrowDown':
        case 's':
            keyState.down = false;
            break;
        case 'ArrowLeft':
        case 'a':
            keyState.left = false;
            break;
        case 'ArrowRight':
        case 'd':
            keyState.right = false;
            break;
        case ' ': // Space bar
            keyState.space = false;
            break;
    }
});

// Preload assets and start the game loop
document.addEventListener('DOMContentLoaded', () => {
    // Preload assets
    preloadGameAssets();

    // Start the game loop
    window.animationFrameId = requestAnimationFrame(gameLoop);
});