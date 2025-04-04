/**
 * Audio Utilities
 * Handles game sound effects and music
 */
import { SOUND_EFFECTS } from './constants.js';

// Cache for audio objects
const audioCache = {};

// Audio settings
let masterVolume = 0.7;
let sfxVolume = 0.8;
let musicVolume = 0.5;
let audioEnabled = true;

/**
 * Initialize audio system
 */
export function initAudio() {
    // Preload all sound effects
    Object.values(SOUND_EFFECTS).forEach(src => {
        if (src) {
            preloadAudio(src);
        }
    });

    // Try to start background music
    playBackgroundMusic();

    // Add volume control listener
    document.addEventListener('keydown', (e) => {
        // + key increases volume
        if (e.key === '+' || e.key === '=') {
            setMasterVolume(masterVolume + 0.1);
        }
        // - key decreases volume
        if (e.key === '-' || e.key === '_') {
            setMasterVolume(masterVolume - 0.1);
        }
        // M key toggles audio
        if (e.key === 'm' || e.key === 'M') {
            toggleAudio();
        }
    });
}

/**
 * Preload an audio file
 * @param {string} src - Audio file path
 */
function preloadAudio(src) {
    if (!audioCache[src]) {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audioCache[src] = audio;
    }
}

/**
 * Play a sound effect
 * @param {string} type - Sound effect type (use constants from SOUND_EFFECTS)
 */
export function playSoundEffect(type) {
    if (!audioEnabled) return;

    const src = SOUND_EFFECTS[type];
    if (!src) return;

    // Create a new audio instance each time for sound effects
    // This allows multiple overlapping instances
    const audio = new Audio(src);
    audio.volume = sfxVolume * masterVolume;

    // Play the sound
    audio.play().catch(error => {
        console.error(`Error playing sound ${type}:`, error);
    });
}

/**
 * Play background music
 */
export function playBackgroundMusic() {
    if (!audioEnabled) return;

    const musicSrc = SOUND_EFFECTS.BACKGROUND;
    if (!musicSrc) return;

    const bgMusic = document.getElementById('background-music');
    if (bgMusic) {
        bgMusic.volume = musicVolume * masterVolume;
        bgMusic.play().catch(error => {
            console.warn('Could not autoplay background music. User interaction required.', error);
        });
    }
}

/**
 * Stop background music
 */
export function stopBackgroundMusic() {
    const bgMusic = document.getElementById('background-music');
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
}

/**
 * Set master volume level
 * @param {number} level - Volume level (0.0 to 1.0)
 */
export function setMasterVolume(level) {
    // Clamp volume between 0 and 1
    masterVolume = Math.max(0, Math.min(1, level));

    // Update background music volume
    const bgMusic = document.getElementById('background-music');
    if (bgMusic) {
        bgMusic.volume = musicVolume * masterVolume;
    }

    // Display volume indicator
    showVolumeIndicator();
}

/**
 * Set SFX volume level
 * @param {number} level - Volume level (0.0 to 1.0)
 */
export function setSfxVolume(level) {
    sfxVolume = Math.max(0, Math.min(1, level));
}

/**
 * Set music volume level
 * @param {number} level - Volume level (0.0 to 1.0)
 */
export function setMusicVolume(level) {
    musicVolume = Math.max(0, Math.min(1, level));

    // Update background music volume
    const bgMusic = document.getElementById('background-music');
    if (bgMusic) {
        bgMusic.volume = musicVolume * masterVolume;
    }
}

/**
 * Toggle audio on/off
 */
export function toggleAudio() {
    audioEnabled = !audioEnabled;

    if (audioEnabled) {
        // Resume background music
        playBackgroundMusic();
        showAudioIndicator('Audio Enabled');
    } else {
        // Stop all audio
        stopBackgroundMusic();
        showAudioIndicator('Audio Disabled');
    }
}

/**
 * Show volume level indicator
 */
function showVolumeIndicator() {
    // Create or get volume indicator
    let indicator = document.getElementById('volume-indicator');

    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'volume-indicator';
        indicator.style.position = 'fixed';
        indicator.style.top = '20px';
        indicator.style.right = '20px';
        indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        indicator.style.color = 'white';
        indicator.style.padding = '10px';
        indicator.style.borderRadius = '5px';
        indicator.style.zIndex = '1000';
        indicator.style.transition = 'opacity 0.5s';
        document.body.appendChild(indicator);
    }

    // Show volume level
    indicator.textContent = `Volume: ${Math.round(masterVolume * 100)}%`;
    indicator.style.opacity = '1';

    // Hide after delay
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 2000);
}

/**
 * Show audio status indicator
 * @param {string} message - Status message to display
 */
function showAudioIndicator(message) {
    // Create or get audio indicator
    let indicator = document.getElementById('audio-indicator');

    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'audio-indicator';
        indicator.style.position = 'fixed';
        indicator.style.top = '60px';
        indicator.style.right = '20px';
        indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        indicator.style.color = 'white';
        indicator.style.padding = '10px';
        indicator.style.borderRadius = '5px';
        indicator.style.zIndex = '1000';
        indicator.style.transition = 'opacity 0.5s';
        document.body.appendChild(indicator);
    }

    // Show audio status
    indicator.textContent = message;
    indicator.style.opacity = '1';

    // Hide after delay
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 2000);
}

/**
 * Play game sound based on event
 * @param {string} event - Game event (place-bomb, explosion, etc.)
 */
export function playGameSound(event) {
    switch (event) {
        case 'place-bomb':
            playSoundEffect('BOMB_PLACE');
            break;
        case 'explosion':
            playSoundEffect('EXPLOSION');
            break;
        case 'powerup':
            playSoundEffect('POWERUP');
            break;
        case 'player-hit':
            playSoundEffect('PLAYER_HIT');
            break;
        case 'game-start':
            playSoundEffect('GAME_START');
            break;
        case 'game-over':
            playSoundEffect('GAME_OVER');
            break;
        case 'countdown':
            playSoundEffect('COUNTDOWN');
            break;
    }
}

// Export a default object with all functions
export default {
    initAudio,
    playSoundEffect,
    playBackgroundMusic,
    stopBackgroundMusic,
    setMasterVolume,
    setSfxVolume,
    setMusicVolume,
    toggleAudio,
    playGameSound
};