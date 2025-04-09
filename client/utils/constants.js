/**
 * Game Constants
 * Defines constants used throughout the game
 */

// Map cell types
export const CELL_TYPES = {
    EMPTY: 0,
    BLOCK: 1, // Destructible
    WALL: 2   // Indestructible
};

// Cell size in pixels
export const CELL_SIZE = 40;

// Power-up types
export const POWER_UP_TYPES = {
    BOMB: 'bomb',    // Increases bomb count
    FLAME: 'flame',  // Increases explosion range
    SPEED: 'speed'   // Increases movement speed
};

// Game settings
export const GAME_SETTINGS = {
    DEFAULT_LIVES: 3,       // Default number of lives
    DEFAULT_BOMBS: 1,       // Default bomb count
    DEFAULT_FLAME_SIZE: 1,  // Default explosion range
    DEFAULT_SPEED: 1,       // Default movement speed

    // Bomb settings
    BOMB_TIMER_MS: 2000,      // Time until bomb explodes (milliseconds)
    EXPLOSION_DURATION_MS: 1000, // How long explosions stay on the map (milliseconds)

    // Game timing
    COUNTDOWN_SECONDS: 10,  // Game start countdown
    WAITING_PERIOD_SECONDS: 20, // Time to wait for more players

    // UI settings
    CHAT_MESSAGE_LIMIT: 50  // Maximum number of chat messages to store
};

// Sound settings
export const SOUND_EFFECTS = {
    BOMB_PLACE: '/assets/audio/bomb_place.wav',
    EXPLOSION: '/assets/audio/explosion.wav',
    POWERUP: '/assets/audio/powerup.wav',
    PLAYER_HIT: '/assets/audio/player_hit.wav',
    GAME_START: '/assets/audio/game_start.wav',
    GAME_OVER: '/assets/audio/game_over.wav',
    COUNTDOWN: '/assets/audio/countdown.mp3',
    BACKGROUND: '/assets/audio/background.wav'
};

// Player colors (for name labels)
export const PLAYER_COLORS = [
    '#e74c3c', // Red
    '#3498db', // Blue
    '#2ecc71', // Green
    '#f39c12', // Orange
    '#9b59b6', // Purple
    '#34495e'  // Dark blue
];

// Message types for WebSocket communication
export const MESSAGE_TYPES = {
    // Client to server
    JOIN: 'JOIN',
    RECONNECT: 'RECONNECT',
    CHAT: 'CHAT',
    PLAYER_MOVE: 'PLAYER_MOVE',
    PLACE_BOMB: 'PLACE_BOMB',
    START_SOLO_GAME: 'START_SOLO_GAME', 


    // Server to client
    JOIN_SUCCESS: 'JOIN_SUCCESS',
    ERROR: 'ERROR',
    PLAYER_JOINED: 'PLAYER_JOINED',
    PLAYER_LEFT: 'PLAYER_LEFT',
    WAITING_PERIOD_STARTED: 'WAITING_PERIOD_STARTED',
    GAME_COUNTDOWN_STARTED: 'GAME_COUNTDOWN_STARTED',
    GAME_COUNTDOWN_UPDATE: 'GAME_COUNTDOWN_UPDATE',
    TIMER_CANCELED: 'TIMER_CANCELED',
    GAME_STARTED: 'GAME_STARTED',
    GAME_STATE_UPDATE: 'GAME_STATE_UPDATE',
    BOMB_PLACED: 'BOMB_PLACED',
    BOMB_EXPLODED: 'BOMB_EXPLODED',
    BLOCK_DESTROYED: 'BLOCK_DESTROYED',
    POWER_UP_SPAWNED: 'POWER_UP_SPAWNED',
    POWER_UP_COLLECTED: 'POWER_UP_COLLECTED',
    PLAYER_HIT: 'PLAYER_HIT',
    PLAYER_ELIMINATED: 'PLAYER_ELIMINATED',
    PLAYER_DISCONNECTED: 'PLAYER_DISCONNECTED',
    CHAT_MESSAGE: 'CHAT_MESSAGE',
    GAME_OVER: 'GAME_OVER',
    RETURNED_TO_WAITING_ROOM: 'RETURNED_TO_WAITING_ROOM'
};

export default {
    CELL_TYPES,
    CELL_SIZE,
    POWER_UP_TYPES,
    GAME_SETTINGS,
    SOUND_EFFECTS,
    PLAYER_COLORS,
    MESSAGE_TYPES
};