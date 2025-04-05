/**
 * Game Component
 * Displays the main game screen
 */
import { createElement, getState } from '../../../src/index.js';
import Map from './Map.js';

/**
 * Game Component
 * @returns {Object} Virtual DOM element
 */
function Game() {
    const state = getState();
    const { player, game } = state;
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
                    display: 'inline-block',
                    width: '24px',
                    height: '24px',
                    backgroundImage: i < lives ?
                        'url("/assets/images/ui/heart.png")' :
                        'url("/assets/images/ui/heart-empty.png")',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    margin: '0 2px'
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
        class: 'game-over-overlay',
        style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
            animation: 'fadeIn 0.5s forwards'
        }
    }, [
        createElement('div', {
            class: 'game-over-content',
            style: {
                backgroundColor: '#34495e',
                padding: '2rem',
                borderRadius: '8px',
                textAlign: 'center',
                maxWidth: '400px',
                boxShadow: '0 0 20px rgba(231, 76, 60, 0.5)',
                animation: 'slideInUp 0.5s forwards'
            }
        }, [
            createElement('h2', {
                class: 'game-over-title',
                style: {
                    color: '#e74c3c',
                    fontSize: '2rem',
                    marginBottom: '1rem'
                }
            }, ['Game Over']),

            winner ? createElement('p', {
                class: 'game-over-message',
                style: {
                    fontSize: '1.2rem',
                    marginBottom: '1.5rem'
                }
            }, [
                winner.id === yourId ?
                    'You Won! Congratulations!' :
                    `${winner.nickname} Won!`
            ]) : createElement('p', {
                class: 'game-over-message',
                style: {
                    fontSize: '1.2rem',
                    marginBottom: '1.5rem'
                }
            }, ['It\'s a draw! No survivors!']),

            createElement('p', {
                class: 'game-over-info',
                style: {
                    color: '#bdc3c7',
                    fontStyle: 'italic'
                }
            }, ['Returning to waiting room shortly...'])
        ])
    ]) : null;

    // Dead overlay if current player is dead but game is not over
    const deadOverlay = currentPlayer.lives <= 0 && !gameOver ? createElement('div', {
        class: 'dead-overlay',
        style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 90,
            animation: 'fadeIn 0.5s forwards'
        }
    }, [
        createElement('div', {
            class: 'dead-content',
            style: {
                backgroundColor: '#34495e',
                padding: '2rem',
                borderRadius: '8px',
                textAlign: 'center',
                maxWidth: '400px',
                boxShadow: '0 0 20px rgba(231, 76, 60, 0.5)',
                animation: 'slideInUp 0.5s forwards'
            }
        }, [
            createElement('h2', {
                class: 'dead-title',
                style: {
                    color: '#e74c3c',
                    fontSize: '2rem',
                    marginBottom: '1rem'
                }
            }, ['You Died!']),

            createElement('p', {
                class: 'dead-message',
                style: {
                    fontSize: '1.2rem',
                    marginBottom: '1.5rem'
                }
            }, ['You\'ve been eliminated from the game. You can still watch the remaining players.']),
        ])
    ]) : null;

    // Game container styles
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        minHeight: '100vh',
        backgroundImage: 'linear-gradient(135deg, #2c3e50 0%, #1a2530 100%)'
    };

    // Game header styles
    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '1.5rem',
        justifyContent: 'space-between',
        flexWrap: 'wrap'
    };

    // Game title styles
    const titleStyle = {
        color: '#e74c3c',
        fontSize: '2.5rem',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        margin: 0
    };

    // Player info styles
    const playerInfoStyle = {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#34495e',
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
    };

    // Player stats styles
    const statsStyle = {
        display: 'flex',
        gap: '1.5rem',
        marginLeft: '1rem'
    };

    // Game content styles
    const contentStyle = {
        display: 'flex',
        flex: 1,
        gap: '1.5rem',
        alignItems: 'flex-start',
        flexWrap: 'wrap'
    };

    // Game sidebar styles
    const sidebarStyle = {
        flex: '1 1 300px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
    };

    // Map container styles
    const mapContainerStyle = {
        flex: '3 1 600px',
        backgroundColor: '#34495e',
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
    };

    // Stat item styles
    const statItemStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    };

    return createElement('div', { class: 'game-container', style: containerStyle }, [
        // Game Header with player info
        createElement('header', { class: 'game-header', style: headerStyle }, [
            // Game title
            createElement('h1', { class: 'game-title', style: titleStyle }, ['BombermanDOM']),

            // Current player info
            createElement('div', { class: 'player-info', style: playerInfoStyle }, [
                // Player name and avatar
                createElement('div', {
                    class: 'player-identity',
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }
                }, [
                    // Player avatar
                    createElement('div', {
                        class: 'player-avatar',
                        style: {
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundImage: `url("/assets/images/players/player${parseInt(yourId?.replace(/\D/g, '') || '1') % 6 + 1}.png")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '2px solid gold'
                        }
                    }),

                    // Player name
                    createElement('div', {
                        class: 'player-name',
                        style: { fontWeight: 'bold' }
                    }, [currentPlayer.nickname || 'You'])
                ]),

                // Player stats
                createElement('div', { class: 'player-stats', style: statsStyle }, [
                    // Lives
                    createElement('div', { class: 'stat-item', style: statItemStyle }, [
                        createElement('span', { class: 'stat-label' }, ['Lives:']),
                        createElement('div', { class: 'stat-value' }, renderLives(currentPlayer.lives || 0))
                    ]),

                    // Bombs
                    createElement('div', { class: 'stat-item', style: statItemStyle }, [
                        createElement('span', { class: 'stat-label' }, ['Bombs:']),
                        createElement('span', {
                            class: 'stat-value',
                            style: { fontWeight: 'bold', color: '#e74c3c' }
                        }, [currentPlayer.bombs || 1])
                    ]),

                    // Explosion range
                    createElement('div', { class: 'stat-item', style: statItemStyle }, [
                        createElement('span', { class: 'stat-label' }, ['Range:']),
                        createElement('span', {
                            class: 'stat-value',
                            style: { fontWeight: 'bold', color: '#f39c12' }
                        }, [currentPlayer.flames || 1])
                    ]),

                    // Speed
                    createElement('div', { class: 'stat-item', style: statItemStyle }, [
                        createElement('span', { class: 'stat-label' }, ['Speed:']),
                        createElement('span', {
                            class: 'stat-value',
                            style: { fontWeight: 'bold', color: '#2ecc71' }
                        }, [currentPlayer.speed || 1])
                    ])
                ])
            ])
        ]),

        // Main game content area
        createElement('div', { class: 'game-content', style: contentStyle }, [
            // Game map container
            createElement('div', { class: 'game-map-container', style: mapContainerStyle }, [
                // Render map component if map data is available
                map ? Map({
                    map,
                    players,
                    bombs,
                    powerUps,
                    explosions,
                    yourId
                }) : createElement('div', { class: 'loading' }, ['Loading map...']),

                // Game over overlay
                gameOverOverlay,

                // Dead overlay
                deadOverlay
            ]),

            // Game sidebar
            createElement('div', { class: 'game-sidebar', style: sidebarStyle }, [
                // Players list
                createElement('div', {
                    class: 'players-list-container',
                    style: {
                        backgroundColor: '#34495e',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                    }
                }, [
                    createElement('h2', {
                        style: {
                            margin: '0 0 1rem 0',
                            fontSize: '1.5rem',
                            color: '#ecf0f1'
                        }
                    }, ['Players']),

                    createElement('ul', {
                        class: 'players-list',
                        style: {
                            listStyle: 'none',
                            padding: 0,
                            margin: 0
                        }
                    }, players.map(p =>
                        createElement('li', {
                            class: `player-item ${p.id === yourId ? 'you' : ''} ${p.lives <= 0 ? 'dead' : ''}`,
                            key: p.id,
                            style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: p.id === yourId ? 'rgba(231, 76, 60, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                                padding: '0.75rem',
                                borderRadius: '4px',
                                marginBottom: '0.75rem',
                                borderLeft: p.id === yourId ? '3px solid #e74c3c' : 'none',
                                opacity: p.lives <= 0 ? 0.6 : 1
                            }
                        }, [
                            // Player info
                            createElement('div', {
                                class: 'player-info',
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                }
                            }, [
                                // Player avatar
                                createElement('div', {
                                    class: 'player-avatar',
                                    style: {
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        backgroundImage: `url("/assets/images/players/player${parseInt(p.id.replace(/\D/g, '')) % 6 + 1}.png")`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }
                                }),

                                // Player name
                                createElement('span', { class: 'player-name' }, [
                                    p.id === yourId ? `${p.nickname} (You)` : p.nickname
                                ])
                            ]),

                            // Player status
                            createElement('div', { class: 'player-status' }, [
                                // Lives as hearts
                                ...renderLives(p.lives)
                            ])
                        ])
                    ))
                ]),

                // Chat
                createElement('div', {
                    class: 'game-chat-container',
                    style: {
                        backgroundColor: '#34495e',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1
                    }
                }, [
                    createElement('h2', {
                        style: {
                            margin: '0 0 1rem 0',
                            fontSize: '1.5rem',
                            color: '#ecf0f1'
                        }
                    }, ['Chat']),

                    createElement('div', {
                        class: 'game-chat-messages',
                        id: 'game-chat-messages',
                        style: {
                            flex: 1,
                            overflowY: 'auto',
                            marginBottom: '1rem',
                            maxHeight: '300px',
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '4px',
                            padding: '0.75rem'
                        }
                    }, chatMessages.map(msg =>
                        createElement('div', {
                            class: `chat-message ${msg.senderId === yourId ? 'own' : ''}`,
                            key: `${msg.senderId}-${msg.timestamp}`,
                            style: {
                                marginBottom: '0.75rem',
                                backgroundColor: msg.senderId === yourId ? 'rgba(52, 152, 219, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '4px',
                                maxWidth: '85%',
                                marginLeft: msg.senderId === yourId ? 'auto' : '0',
                                borderLeft: msg.senderId === yourId ? '3px solid #3498db' : 'none'
                            }
                        }, [
                            createElement('div', {
                                class: 'message-header',
                                style: {
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '0.25rem',
                                    fontSize: '0.85rem'
                                }
                            }, [
                                createElement('span', {
                                    class: 'message-sender',
                                    style: {
                                        fontWeight: 'bold',
                                        color: msg.senderId === yourId ? '#3498db' : '#e74c3c'
                                    }
                                }, [
                                    msg.senderId === yourId ? 'You' : msg.sender
                                ]),
                                createElement('span', {
                                    class: 'message-time',
                                    style: { color: '#95a5a6' }
                                }, [
                                    new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })
                                ])
                            ]),
                            createElement('div', {
                                class: 'message-content',
                                style: { wordBreak: 'break-word' }
                            }, [msg.message])
                        ])
                    )),

                    createElement('form', {
                        class: 'chat-form',
                        onSubmit: handleSendMessage,
                        style: {
                            display: 'flex',
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }
                    }, [
                        createElement('input', {
                            id: 'game-chat-input',
                            type: 'text',
                            class: 'chat-input',
                            placeholder: 'Type your message...',
                            maxlength: 100,
                            style: {
                                flex: 1,
                                padding: '0.75rem',
                                border: 'none',
                                backgroundColor: '#2c3e50',
                                color: '#ecf0f1',
                                outline: 'none'
                            }
                        }),
                        createElement('button', {
                            type: 'submit',
                            class: 'chat-send-button',
                            style: {
                                padding: '0.75rem 1rem',
                                backgroundColor: '#3498db',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'background-color 0.3s'
                            }
                        }, ['Send'])
                    ])
                ])
            ])
        ]),

        // Controls info
        createElement('div', {
            class: 'game-controls',
            style: {
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                padding: '0.75rem',
                borderRadius: '8px',
                textAlign: 'center',
                marginTop: '1.5rem',
                color: '#bdc3c7',
                fontSize: '0.9rem'
            }
        }, [
            createElement('p', { style: { margin: 0 } }, [
                'Controls: Arrow keys or WASD to move, SPACE to place bombs'
            ])
        ]),

        // Background music
        createElement('audio', {
            src: '/assets/audio/background.wav',
            id: 'background-music',
            loop: true,
            autoplay: true,
            style: { display: 'none' }
        })
    ]);
}

// Add code to handle sounds and asset loading
// This function will be called after the component is rendered
setTimeout(() => {
    // Set background music volume
    const bgMusic = document.getElementById('background-music');
    if (bgMusic) {
        bgMusic.volume = 0.3; // Lower volume for background music
    }

    // Scroll to the bottom of chat on load
    const chatContainer = document.getElementById('game-chat-messages');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    const images = document.querySelectorAll('div[style*="background-image"]');
    images.forEach(img => {
        const url = img.style.backgroundImage.match(/url\(['"]?([^'"]*)['"]?\)/)?.[1];
        if (url) {
            console.log(`Loading image: ${url}`);
            // Create a temporary Image to test loading
            const testImg = new Image();
            testImg.onerror = () => console.error(`Failed to load: ${url}`);
            testImg.src = url;
        }
    });


    // Add this to your Game.js component inside the setTimeout function
    console.log("Checking asset loading...");

// Debug image loading
    const debugImageLoading = (url) => {
        const img = new Image();
        img.onload = () => console.log(`✅ Successfully loaded: ${url}`);
        img.onerror = () => console.error(`❌ Failed to load: ${url}`);
        img.src = url;
    };

// Check important game assets
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
        '/audio/bomb_place.wav',
        '/audio/explosion.wav'
    ].forEach(debugImageLoading);

}, 500);

export default Game;