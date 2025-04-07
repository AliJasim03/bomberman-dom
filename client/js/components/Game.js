/**
 * Game Component
 * Displays the main game screen
 * Optimized to use CSS classes instead of inline styles
 */
import {createElement, getState} from '../../../src/index.js';
import Map from './Map.js';

let gameAudioInitialized = false;



/**
 * Game Component
 * @returns {Object} Virtual DOM element
 */
function Game() {
    const state = getState();
    const {player, game} = state;
    const {
        players = [],
        map,
        bombs = [],
        powerUps = [],
        explosions = [],
        chatMessages = [],
        yourId,
        gameOver,
        winner
    } = game;

    // Find current player
    const currentPlayer = players.find(p => p.id === yourId) || {};

    // Function to render lives as heart icons
    const renderLives = (lives) => {
        const hearts = [];
        for (let i = 0; i < 3; i++) {
            hearts.push(createElement('span', {
                class: `heart ${i < lives ? 'active' : 'lost'}`,
                key: `heart-${i}`,
                style: {
                    backgroundImage: i < lives ?
                        'url("/assets/images/ui/heart.png")' :
                        'url("/assets/images/ui/heart-empty.png")'
                }
            }));
        }
        return hearts;
    };

    // Handle sending chat messages
    const handleSendMessage = (e) => {
        e.preventDefault();

        const chatInput = document.getElementById('game-chat-input');
        const message = chatInput.value.trim();

        if (!message) return;

        // Send chat message to server
        if (window.socket && window.socket.readyState === WebSocket.OPEN) {
            window.socket.send(JSON.stringify({
                type: 'CHAT',
                message
            }));
        }

        // Clear input
        chatInput.value = '';
    };

    // Create game over overlay if game is over
    const gameOverOverlay = gameOver ? createElement('div', {
        class: 'game-over-overlay'
    }, [
        createElement('div', {
            class: 'game-over-content'
        }, [
            createElement('h2', {class: 'game-over-title'}, ['Game Over']),

            winner ? createElement('p', {class: 'game-over-message'}, [
                winner.id === yourId ?
                    'You Won! Congratulations!' :
                    `${winner.nickname} Won!`
            ]) : createElement('p', {class: 'game-over-message'}, ['It\'s a draw! No survivors!']),

            createElement('p', {class: 'game-over-info'}, [
                'Returning to waiting room shortly...'
            ])
        ])
    ]) : null;

    // Dead overlay if current player is dead but game is not over
    const deadOverlay = currentPlayer.lives <= 0 && !gameOver ? createElement('div', {
        class: 'dead-overlay'
    }, [
        createElement('div', {
            class: 'dead-content'
        }, [
            createElement('h2', {class: 'dead-title'}, ['You Died!']),

            createElement('p', {class: 'dead-message'}, [
                'You\'ve been eliminated from the game. You can still watch the remaining players.'
            ])
        ])
    ]) : null;

    return createElement('div', {class: 'game-container'}, [
        // Game Header with player info
        createElement('header', {class: 'game-header'}, [
            // Game title
            createElement('h1', {class: 'game-title'}, ['BombermanDOM']),

            // Current player info
            createElement('div', {class: 'player-info'}, [
                // Player name and avatar
                createElement('div', {class: 'player-identity'}, [
                    // Player avatar
                    createElement('div', {
                        class: 'player-avatar',
                        style: {
                            backgroundImage: `url("/assets/images/players/player${parseInt(yourId?.replace(/\D/g, '') || '1') % 6 + 1}.png")`
                        }
                    }),

                    // Player name
                    createElement('div', {class: 'player-name-display'}, [
                        currentPlayer.nickname || 'You'
                    ])
                ]),

                // Player stats
                createElement('div', {class: 'player-stats'}, [
                    // Lives
                    createElement('div', {class: 'stat-item'}, [
                        createElement('span', {class: 'stat-label'}, ['Lives:']),
                        createElement('div', {class: 'stat-value lives-container'},
                            renderLives(currentPlayer.lives || 0)
                        )
                    ]),

                    // Bombs
                    createElement('div', {class: 'stat-item'}, [
                        createElement('span', {class: 'stat-label'}, ['Bombs:']),
                        createElement('span', {class: 'stat-value bomb-value'}, [
                            currentPlayer.bombs || 1
                        ])
                    ]),

                    // Explosion range
                    createElement('div', {class: 'stat-item'}, [
                        createElement('span', {class: 'stat-label'}, ['Range:']),
                        createElement('span', {class: 'stat-value flame-value'}, [
                            currentPlayer.flames || 1
                        ])
                    ]),

                    // Speed
                    createElement('div', {class: 'stat-item'}, [
                        createElement('span', {class: 'stat-label'}, ['Speed:']),
                        createElement('span', {class: 'stat-value speed-value'}, [
                            currentPlayer.speed || 1
                        ])
                    ])
                ])
            ])
        ]),

        // Main game content area
        createElement('div', {class: 'game-content'}, [
            // Game map container
            createElement('div', {class: 'game-map-container'}, [
                // Render map component if map data is available
                map ? Map({
                    map,
                    players,
                    bombs,
                    powerUps,
                    explosions,
                    yourId
                }) : createElement('div', {class: 'loading'}, ['Loading map...']),

                // Game over overlay
                gameOverOverlay,

                // Dead overlay
                deadOverlay
            ]),

            // Game sidebar
            createElement('div', {class: 'game-sidebar'}, [
                // Players list
                createElement('div', {class: 'players-list-container'}, [
                    createElement('h2', {class: 'section-title'}, ['Players']),

                    createElement('ul', {class: 'players-list'},
                        players.map(p =>
                            createElement('li', {
                                class: `player-item ${p.id === yourId ? 'you' : ''} ${p.lives <= 0 ? 'dead' : ''}`,
                                key: p.id
                            }, [
                                // Player info
                                createElement('div', {class: 'player-info-item'}, [
                                    // Player avatar
                                    createElement('div', {
                                        class: 'player-list-avatar',
                                        style: {
                                            backgroundImage: `url("/assets/images/players/player${parseInt(p.id.replace(/\D/g, '')) % 6 + 1}.png")`
                                        }
                                    }),

                                    // Player name
                                    createElement('span', {class: 'player-list-name'}, [
                                        p.id === yourId ? `${p.nickname} (You)` : p.nickname
                                    ])
                                ]),

                                // Player status
                                createElement('div', {class: 'player-status'}, [
                                    // Lives as hearts
                                    ...renderLives(p.lives)
                                ])
                            ])
                        )
                    )
                ]),

                // Chat
                createElement('div', {class: 'game-chat-container'}, [
                    createElement('h2', {class: 'section-title'}, ['Chat']),

                    createElement('div', {
                        class: 'game-chat-messages',
                        id: 'game-chat-messages'
                    }, chatMessages.map(msg =>
                        createElement('div', {
                            class: `chat-message ${msg.senderId === yourId ? 'own' : ''}`,
                            key: `${msg.senderId}-${msg.timestamp}`
                        }, [
                            createElement('div', {class: 'message-header'}, [
                                createElement('span', {
                                    class: `message-sender ${msg.senderId === yourId ? 'self' : 'other'}`
                                }, [
                                    msg.senderId === yourId ? 'You' : msg.sender
                                ]),
                                createElement('span', {class: 'message-time'}, [
                                    new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })
                                ])
                            ]),
                            createElement('div', {class: 'message-content'}, [
                                msg.message
                            ])
                        ])
                    )),

                    createElement('form', {class: 'chat-form', onSubmit: handleSendMessage}, [
                        createElement('input', {
                            id: 'game-chat-input',
                            type: 'text',
                            class: 'chat-input',
                            placeholder: 'Type your message...',
                            maxlength: 100
                        }),
                        createElement('button', {
                            type: 'submit',
                            class: 'chat-send-button'
                        }, ['Send'])
                    ])
                ])
            ])
        ]),

        // Controls info
        createElement('div', {class: 'game-controls'}, [
            createElement('p', {}, [
                'Controls: Arrow keys or WASD to move, SPACE to place bombs'
            ])
        ]),
    ]);
}

// Add code to handle sounds and asset loading
// This function will be called after the component is rendered
setTimeout(() => {
    // Set background music volume
    gameAudioInitialized = true;

    optimizePlayersList();

    // Scroll to the bottom of chat on load
    const chatContainer = document.getElementById('game-chat-messages');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Debug image loading
    const debugImageLoading = (url) => {
        // Only try to load images, not audio
        if (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.svg')) {
            const img = new Image();
            img.onload = () => console.log(`✅ Successfully loaded: ${url}`);
            img.onerror = () => console.error(`❌ Failed to load: ${url}`);
            img.src = url;
        }
    };

    // Check important game assets - IMAGES ONLY
    [
        '/assets/images/bombs/bomb.png',
        '/assets/images/bombs/explosion.png',
        '/assets/images/map/floor.png',
        '/assets/images/map/wall.png',
        '/assets/images/map/block.png',
        '/assets/images/players/player1.png',
        '/assets/images/powerups/bomb_powerup.png',
        '/assets/images/powerups/flame_powerup.png',
        '/assets/images/powerups/speed_powerup.png',
        '/assets/images/ui/heart.png',
        '/assets/images/ui/heart-empty.png'
    ].forEach(debugImageLoading);
}, 500);

function optimizePlayersList() {
    // Find players list container
    const playersListContainer = document.querySelector('.players-list');
    if (!playersListContainer) return;

    // Create a mutation observer to detect when the list is re-rendered
    const observer = new MutationObserver((mutations) => {
        // Immediately disable animations on any player items
        const playerItems = playersListContainer.querySelectorAll('.player-item');
        playerItems.forEach(item => {
            item.style.animation = 'none';
        });
    });

    // Observe changes to the players list
    observer.observe(playersListContainer, {
        childList: true,
        subtree: true
    });
}

export default Game;