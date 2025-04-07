/**
 * Bomberman Audio System
 * A complete rewrite for better audio handling
 */

// Single persistent background music instance
let bgMusic = null;
let audioInitialized = false;
let soundEffects = {};
let pendingAudioButton = false;

/**
 * Initialize the audio system
 * Must be called once on app startup
 */
export function initAudioSystem() {
    if (audioInitialized) return;

    console.log("Initializing audio system");

    // Create hidden background music element
    // We create this early but don't load or play until user interaction
    bgMusic = document.createElement('audio');
    bgMusic.id = 'background-music';
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    bgMusic.style.display = 'none';

    // Wait for user interaction before trying to play audio
    document.addEventListener('click', initializeAudioOnUserAction, { once: true });
    document.addEventListener('keydown', initializeAudioOnUserAction, { once: true });

    // Add element to DOM
    document.body.appendChild(bgMusic);

    audioInitialized = true;
}

/**
 * Create and show an audio button for mobile/touch devices
 */
function showAudioButton() {
    if (pendingAudioButton) return;
    pendingAudioButton = true;

    // Create a button that users can explicitly click to enable audio
    const audioButton = document.createElement('button');
    audioButton.id = 'enable-audio-button';
    audioButton.textContent = "Enable Audio";
    audioButton.style.position = 'fixed';
    audioButton.style.bottom = '20px';
    audioButton.style.right = '20px';
    audioButton.style.zIndex = '9999';
    audioButton.style.padding = '10px 15px';
    audioButton.style.backgroundColor = '#e74c3c';
    audioButton.style.color = 'white';
    audioButton.style.border = 'none';
    audioButton.style.borderRadius = '4px';
    audioButton.style.cursor = 'pointer';
    audioButton.style.fontWeight = 'bold';
    audioButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

    // When clicked, enable all audio
    audioButton.addEventListener('click', () => {
        initializeAudioOnUserAction();
        audioButton.remove();
    });

    document.body.appendChild(audioButton);
}

/**
 * Initialize audio after user interaction
 * Required by most browsers to allow autoplay
 */
function initializeAudioOnUserAction() {
    // Hide audio button if visible
    const button = document.getElementById('enable-audio-button');
    if (button) button.remove();

    // Only proceed if we have a background music element
    if (!bgMusic) return;

    console.log("User interaction detected, enabling audio");

    // Set the src only after user interaction
    bgMusic.src = '/assets/audio/background.wav';

    // Try to play background music
    bgMusic.play().then(() => {
        console.log("Background music started successfully");
    }).catch(err => {
        console.warn("Could not autoplay background music:", err);
        showAudioButton();
    });
}

/**
 * Preload and cache a sound effect
 * @param {string} id - Unique identifier for the sound
 * @param {string} src - Path to audio file
 * @returns {Promise} Promise that resolves when audio is loaded
 */
export function preloadSound(id, src) {
    return new Promise((resolve, reject) => {
        // Check if already cached
        if (soundEffects[id]) {
            resolve(soundEffects[id]);
            return;
        }

        console.log(`Preloading sound: ${id} (${src})`);

        const audio = new Audio();

        // Set up load event handler
        audio.addEventListener('canplaythrough', () => {
            soundEffects[id] = audio;
            console.log(`Sound loaded: ${id}`);
            resolve(audio);
        }, { once: true });

        // Set up error handler
        audio.addEventListener('error', (err) => {
            console.error(`Failed to load sound: ${id}`, err);

            // Try alternate path
            if (!src.startsWith('/audio/')) {
                const altSrc = '/audio/' + src.split('/').pop();
                console.log(`Trying alternate path: ${altSrc}`);

                const altAudio = new Audio();
                altAudio.addEventListener('canplaythrough', () => {
                    soundEffects[id] = altAudio;
                    console.log(`Sound loaded from alternate path: ${id}`);
                    resolve(altAudio);
                }, { once: true });

                altAudio.addEventListener('error', (err2) => {
                    console.error(`Also failed with alternate path: ${id}`, err2);
                    reject(err2);
                });

                altAudio.src = altSrc;
                altAudio.load();
            } else {
                reject(err);
            }
        });

        // Start loading
        audio.src = src;
        audio.load();
    });
}

/**
 * Preload all game sounds
 */
export function preloadAllGameSounds() {
    const sounds = {
        'bombPlace': '/assets/audio/bomb_place.wav',
        'explosion': '/assets/audio/explosion.wav',
        'powerup': '/assets/audio/powerup.wav',
        'playerHit': '/assets/audio/player_hit.wav',
        'gameStart': '/assets/audio/game_start.wav',
        'gameOver': '/assets/audio/game_over.wav',
        'countdown': '/assets/audio/countdown.mp3'
    };

    // Preload each sound
    Object.entries(sounds).forEach(([id, src]) => {
        preloadSound(id, src).catch(err => {
            // Just log errors, don't stop preloading others
            console.warn(`Could not preload sound ${id}:`, err);
        });
    });
}

/**
 * Play a sound effect
 * @param {string} id - Sound identifier or path
 * @param {number} volume - Volume (0-1)
 */
export function playSound(id, volume = 0.5) {
    // Special case for background music
    if (id.includes('background') && bgMusic) {
        if (bgMusic.paused) {
            bgMusic.play().catch(err => {
                console.warn("Could not play background music:", err);
                showAudioButton();
            });
        }
        return;
    }

    // Look for sound by ID first
    let sound = soundEffects[id];

    // If not found by ID, try as a path
    if (!sound && typeof id === 'string') {
        // Extract a sound ID from the path
        const pathId = id.split('/').pop().split('.')[0];
        sound = soundEffects[pathId];

        // If still not found, try to load on demand
        if (!sound) {
            preloadSound(pathId, id)
                .then(audio => {
                    const clone = audio.cloneNode();
                    clone.volume = volume;
                    clone.play().catch(err => console.warn(`Could not play sound ${id}:`, err));
                })
                .catch(err => {
                    console.error(`Could not load sound on demand: ${id}`, err);
                });
            return;
        }
    }

    // Play the sound if found
    if (sound) {
        try {
            const clone = sound.cloneNode();
            clone.volume = volume;
            clone.play().catch(err => console.warn(`Could not play sound ${id}:`, err));
        } catch (err) {
            console.error(`Error playing sound ${id}:`, err);
        }
    } else {
        console.warn(`Sound not found: ${id}`);
    }
}

/**
 * Stop background music
 */
export function stopBackgroundMusic() {
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
}

/**
 * Pause background music
 */
export function pauseBackgroundMusic() {
    if (bgMusic && !bgMusic.paused) {
        bgMusic.pause();
    }
}

/**
 * Resume background music
 */
export function resumeBackgroundMusic() {
    if (bgMusic && bgMusic.paused) {
        bgMusic.play().catch(err => {
            console.warn("Could not resume background music:", err);
            showAudioButton();
        });
    }
}

/**
 * Set background music volume
 * @param {number} volume - Volume level (0-1)
 */
export function setBackgroundMusicVolume(volume) {
    if (bgMusic) {
        bgMusic.volume = Math.max(0, Math.min(1, volume));
    }
}

export default {
    initAudioSystem,
    preloadSound,
    preloadAllGameSounds,
    playSound,
    stopBackgroundMusic,
    pauseBackgroundMusic,
    resumeBackgroundMusic,
    setBackgroundMusicVolume
};