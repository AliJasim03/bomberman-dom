/**
 * Game Component
 * Displays the main game screen with map, players, bombs, and chat
 */
import { createElement, getState } from '../../../src/index.js';
import Chat from './Chat.js';
import Map from './Map.js';

/**
 * Game Component
 * @returns {Object} Virtual DOM element
 */
function Game() {
    const { player, game, performance } = getState();
    const {
        map,
        players,
        bombs,
        powerUps,
        explosions,
        chatMessages = [],
        gameOver,
        winner,
        draw,
        yourId
    } = game;

    // Find current player stats
    const currentPlayer = players.find(p => p.id === yourId) || {};

    /**
     * Handle sending chat messages
     * @param {string} message - Chat message text
     */
    const handleSendMessage = (message) => {
        // Send chat message to server
        if (window.socket && window.socket.readyState === WebSocket.OPEN) {
            window.socket.send(JSON.stringify({
                type: 'CHAT',
                message
            }));
        }
    };

    // Check if the current player is alive
    const isAlive = currentPlayer.lives > 0;

    return createElement('div', { class: 'game-container' }, [
        // Game header with stats
        createElement('div', { class: 'game-header' }, [
            createElement('h1', { class: 'game-title' }, ['BombermanDOM']),

            // Performance counter
            createElement('div', { class: 'performance-counter' }, [
                createElement('span', {}, ['FPS: ']),
                createElement('span', {
                    class: `fps-value ${performance.fps >= 55 ? 'good' : performance.fps >= 30 ? 'warning' : 'bad'}`
                }, [performance.fps.toString()])
            ]),

            // Player stats
            createElement('div', { class: 'player-stats' }, [
                // Lives
                createElement('div', { class: 'stat-item lives' }, [
                    createElement('span', { class: 'stat-label' }, ['Lives:']),
                    createElement('div', { class: 'lives-icons' }, [
                        ...Array(3).fill().map((_, i) => createElement('span', {
                            class: `life-icon ${i < currentPlayer.lives ? 'active' : 'lost'}`
                        }, ['❤️']))
                    ])
                ]),

                // Bombs
                createElement('div', { class: 'stat-item bombs' }, [
                    createElement('span', { class: 'stat-label' }, ['Bombs:']),
                    createElement('span', { class: 'stat-value' }, [currentPlayer.bombs || 1])
                ]),

                // Flames
                createElement('div', { class: 'stat-item flames' }, [
                    createElement('span', { class: 'stat-label' }, ['Range:']),
                    createElement('span', { class: 'stat-value' }, [currentPlayer.flames || 1])
                ]),

                // Speed
                createElement('div', { class: 'stat-item speed' }, [
                    createElement('span', { class: 'stat-label' }, ['Speed:']),
                    createElement('span', { class: 'stat-value' }, [currentPlayer.speed || 1])
                ])
            ])
        ]),

        // Main game content
        createElement('div', { class: 'game-content' }, [
            // Game map section
            createElement('div', { class: 'game-map-container' }, [
                // Game over overlay (if game is over)
                gameOver ? createElement('div', { class: 'game-over-overlay' }, [
                    createElement('div', { class: 'game-over-content' }, [
                        createElement('h2', { class: 'game-over-title' }, ['Game Over']),

                        draw
                            ? createElement('p', { class: 'game-over-message' }, ['It\'s a draw! All players were eliminated.'])
                            : createElement('p', { class: 'game-over-message' }, [
                                winner.id === yourId
                                    ? 'You won!'
                                    : `${winner.nickname} won!`
                            ]),

                        createElement('p', { class: 'game-over-info' }, [
                            'Returning to waiting room shortly...'
                        ])
                    ])
                ]) : null,

                // Dead player overlay (if player is dead but game is still ongoing)
                !gameOver && !isAlive ? createElement('div', { class: 'dead-overlay' }, [
                    createElement('div', { class: 'dead-content' }, [
                        createElement('h2', { class: 'dead-title' }, ['You Died!']),
                        createElement('p', { class: 'dead-message' }, [
                            'You have been eliminated. Watch the remaining players battle it out!'
                        ])
                    ])
                ]) : null,

                // Game map
                map ? createElement(Map, {
                    map,
                    players,
                    bombs,
                    powerUps,
                    explosions,
                    yourId
                }) : createElement('div', { class: 'loading' }, ['Loading map...'])
            ]),

            // Side panel with chat and players list
            createElement('div', { class: 'game-side-panel' }, [
                // Players list
                createElement('div', { class: 'players-list-container' }, [
                    createElement('h3', {}, ['Players']),
                    createElement('ul', { class: 'players-list' },
                        players.map(p => createElement('li', {
                            class: `player-item ${p.lives <= 0 ? 'dead' : ''} ${p.id === yourId ? 'you' : ''}`,
                            key: p.id
                        }, [
                            // Player status indicator
                            createElement('span', {
                                class: `player-status ${p.lives <= 0 ? 'dead' : 'alive'}`
                            }, [p.lives <= 0 ? '☠️' : '👤']),

                            // Player name
                            createElement('span', { class: 'player-name' }, [
                                p.id === yourId ? `${p.nickname} (You)` : p.nickname
                            ]),

                            // Player lives
                            createElement('span', { class: 'player-lives' }, [
                                ...Array(p.lives).fill().map(() => '❤️').join('')
                            ])
                        ]))
                    )
                ]),

                // Chat
                createElement('div', { class: 'game-chat-container' }, [
                    createElement(Chat, {
                        messages: chatMessages,
                        onSendMessage: handleSendMessage,
                        currentUserId: yourId
                    })
                ])
            ])
        ]),

        // Game controls help
        createElement('div', { class: 'game-controls' }, [
            createElement('p', {}, [
                'Controls: Arrow keys or WASD to move, SPACE to place bombs'
            ])
        ])
    ]);
}

export default Game;