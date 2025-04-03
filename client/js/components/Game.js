/**
 * Game Component
 * Displays the main game screen
 */
import { createElement, getState } from '../../../src/index.js';

/**
 * Game Component
 * @returns {Object} Virtual DOM element
 */
// In client/js/components/Game.js

function Game() {
    const state = getState();
    const { player, game } = state;
    const {
        players = [],
        map,
        chatMessages = [],
        yourId
    } = game;

    // Find current player
    const currentPlayer = players.find(p => p.id === yourId) || {};

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

    // Render simple map
    const renderMap = () => {
        if (!map || !map.grid) {
            return createElement('div', { class: 'loading-map' }, ['Loading map...']);
        }

        return createElement('div', {
                class: 'game-map',
                style: {
                    display: 'grid',
                    gridTemplateColumns: `repeat(${map.width}, 32px)`,
                    gridTemplateRows: `repeat(${map.height}, 32px)`
                }
            },
            map.grid.flat().map((cell, index) => {
                const x = index % map.width;
                const y = Math.floor(index / map.width);
                let cellClass = '';

                switch (cell) {
                    case 0: cellClass = 'empty'; break;
                    case 1: cellClass = 'block'; break;
                    case 2: cellClass = 'wall'; break;
                }

                return createElement('div', {
                    class: `map-cell ${cellClass}`,
                    key: `cell-${x}-${y}`,
                    'data-x': x,
                    'data-y': y
                });
            })
        );
    };

    return createElement('div', { class: 'game-container' }, [
        createElement('h1', { class: 'game-title' }, ['Game']),

        createElement('div', { class: 'game-content' }, [
            createElement('div', { class: 'game-map-container' }, [
                renderMap()
            ]),

            createElement('div', { class: 'game-sidebar' }, [
                // Player list
                createElement('div', { class: 'players-info' }, [
                    createElement('h3', {}, ['Players']),
                    createElement('ul', { class: 'game-players-list' },
                        players.map(p => createElement('li', {
                            class: `player-item ${p.id === yourId ? 'you' : ''}`,
                            key: p.id
                        }, [
                            createElement('span', { class: 'player-name' }, [
                                p.id === yourId ? `${p.nickname} (You)` : p.nickname
                            ]),
                            createElement('span', { class: 'player-lives' }, [
                                `Lives: ${p.lives || 0}`
                            ])
                        ]))
                    )
                ]),

                // Chat
                createElement('div', { class: 'game-chat' }, [
                    createElement('h3', {}, ['Chat']),
                    createElement('div', {
                            class: 'game-chat-messages',
                            id: 'game-chat-messages'
                        },
                        chatMessages.map(msg => createElement('div', {
                            class: `chat-message ${msg.senderId === yourId ? 'own' : ''}`,
                            key: `${msg.senderId}-${msg.timestamp}`
                        }, [
                            createElement('div', { class: 'message-header' }, [
                                createElement('span', { class: 'message-sender' }, [
                                    msg.senderId === yourId ? 'You' : msg.sender
                                ]),
                                createElement('span', { class: 'message-time' }, [
                                    new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                ])
                            ]),
                            createElement('div', { class: 'message-content' }, [msg.message])
                        ]))
                    ),
                    createElement('form', {
                        class: 'chat-form',
                        onSubmit: handleSendMessage
                    }, [
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

        createElement('div', { class: 'game-controls' }, [
            createElement('p', {}, [
                'Controls: Arrow keys or WASD to move, SPACE to place bombs'
            ])
        ])
    ]);
}

export default Game;