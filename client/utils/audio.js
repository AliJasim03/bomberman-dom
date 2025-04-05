/**
 * Audio Utilities
 * Handles loading and playing game sounds
 */

// Cache for audio objects
const audioCache = {};

/**
 * Preload an audio file
 * @param {string} src - Path to audio file
 * @returns {Promise} Promise that resolves when audio is loaded
 */
export function preloadAudio(src) {
    return new Promise((resolve, reject) => {
        console.log(`Attempting to preload audio: ${src}`);

        // Check if already in cache
        if (audioCache[src]) {
            console.log(`Audio already in cache: ${src}`);
            resolve(audioCache[src]);
            return;
        }

        // Create new audio element
        const audio = new Audio();

        // Set up load handler
        audio.addEventListener('canplaythrough', () => {
            console.log(`✅ Successfully loaded audio: ${src}`);
            audioCache[src] = audio;
            resolve(audio);
        }, { once: true });

        // Set up error handler
        audio.addEventListener('error', (e) => {
            console.error(`❌ Failed to load audio: ${src}`, e);

            // Try alternate path if original fails (using /audio/ route)
            if (!src.startsWith('/audio/')) {
                const alternateSrc = '/audio/' + src.split('/').pop();
                console.log(`Trying alternate path: ${alternateSrc}`);

                const alternateAudio = new Audio();
                alternateAudio.addEventListener('canplaythrough', () => {
                    console.log(`✅ Successfully loaded audio from alternate path: ${alternateSrc}`);
                    audioCache[src] = alternateAudio; // Store with original key
                    resolve(alternateAudio);
                }, { once: true });

                alternateAudio.addEventListener('error', (e2) => {
                    console.error(`❌ Also failed to load audio from alternate path: ${alternateSrc}`, e2);
                    reject(e2);
                });

                alternateAudio.src = alternateSrc;
                alternateAudio.load();
            } else {
                reject(e);
            }
        });

        // Start loading
        audio.src = src;
        audio.load();
    });
}

/**
 * Play a sound effect
 * @param {string} src - Path to audio file
 * @param {number} volume - Volume level (0.0 to 1.0)
 */
export function playSound(src, volume = 0.5) {
    if (audioCache[src]) {
        // Clone the audio to allow overlapping sounds
        const sound = audioCache[src].cloneNode();
        sound.volume = volume;
        sound.play().catch(e => console.error(`Error playing sound ${src}:`, e));
    } else {
        console.warn(`Audio not preloaded: ${src}`);

        // Try to load and play immediately
        preloadAudio(src)
            .then(audio => {
                const sound = audio.cloneNode();
                sound.volume = volume;
                sound.play().catch(e => console.error(`Error playing sound ${src}:`, e));
            })
            .catch(e => console.error(`Failed to load audio for immediate play: ${src}`, e));
    }
}

/**
 * Preload all game sounds
 */
export function preloadAllGameSounds() {
    const soundFiles = [
        '/assets/audio/bomb_place.wav',
        '/assets/audio/explosion.wav',
        '/assets/audio/powerup.wav',
        '/assets/audio/player_hit.wav',
        '/assets/audio/game_start.wav',
        '/assets/audio/game_over.wav',
        '/assets/audio/background.wav',
        '/assets/audio/countdown.mp3'
    ];

    // Also try alternate paths
    const alternateSoundFiles = soundFiles.map(path => '/audio/' + path.split('/').pop());

    // Preload all sounds
    const allSoundFiles = [...soundFiles, ...alternateSoundFiles];

    console.log('Starting audio preload for all game sounds...');

    // Load all sounds but don't wait for all to complete
    allSoundFiles.forEach(src => {
        preloadAudio(src).catch(e => {
            // Just log errors, don't stop the process
            console.error(`Could not preload ${src}:`, e);
        });
    });
}

export default {
    preloadAudio,
    playSound,
    preloadAllGameSounds
};