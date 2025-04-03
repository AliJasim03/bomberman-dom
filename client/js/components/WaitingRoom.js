/**
 * Waiting Room Component
 * Shows waiting players and countdown until game starts
 */
import { createElement, getState } from '../../../src/index.js';

/**
 * Waiting Room Component
 * @returns {Object} Virtual DOM element
 */
function WaitingRoom() {
    const { player, waitingRoom } = getState();
    const { players, countdown, playersCount, chatMessages = [] } = waitingRoom;

    // Format countdown timer
    const countdownDisplay = countdown !== null
        ? `Game starting in: ${countdown}s`
        : playersCount >= 2
            ? 'Waiting for more players...'
            : 'Waiting for at least one more player to join...';

    /**
     * Handle sending chat messages
     * @param {Event} e - Form submission event
     */
    const handleSendMessage = (e) => {
        e.preventDefault();

        // Get chat input
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();

        // Don't send empty messages
        if (!message) return;

        // Send chat message to server
        if (window.socket && window.socket.readyState === WebSocket.OPEN) {
            window.socket.send(JSON.stringify({
                type: 'CHAT',
                message
            }));

            console.log('Sending chat message:', message);
        }

        // Clear input
        chatInput.value = '';
    };

    // Scroll chat to bottom after render
    setTimeout(() => {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }, 0);

    return createElement('div', { class: 'waiting-container' }, [
        // Header section
        createElement('div', { class: 'waiting-header' }, [
            createElement('h1', { class: 'game-title' }, ['BombermanDOM']),
            createElement('h2', { class: 'waiting-subtitle' }, ['Waiting Room'])
        ]),

        // Main content section
        createElement('div', { class: 'waiting-content' }, [
            // Players section
            createElement('div', { class: 'players-section' }, [
                createElement('h3', {}, ['Players']),
                createElement('div', { class: 'player-counter' }, [
                    createElement('span', {}, ['Players: ']),
                    createElement('span', { class: 'counter' }, [playersCount.toString()]),
                    createElement('span', {}, [' / 4'])
                ]),

                // Player list
                createElement('ul', { class: 'player-list' },
                    players.map(p => createElement('li', {
                        class: 'player-item',
                        key: p.id
                    }, [
                        createElement('span', {
                            class: `player-indicator ${p.id === player.id ? 'you' : ''}`
                        }, [p.id === player.id ? 'You' : '']),
                        createElement('span', { class: 'player-name' }, [p.nickname])
                    ]))
                ),

                // Countdown display - with ID for direct updates
                createElement('div', {
                    class: `countdown ${countdown !== null ? 'active' : ''}`,
                    id: 'countdown-notification'
                }, [countdownDisplay])
            ]),

            // Chat section
            createElement('div', { class: 'chat-section' }, [
                createElement('div', { class: 'chat' }, [
                    // Chat header
                    createElement('div', { class: 'chat-header' }, [
                        createElement('h3', {}, ['Chat'])
                    ]),

                    // Chat messages
                    createElement('div', {
                            class: 'chat-messages',
                            id: 'chat-messages'
                        },
                        chatMessages.map(msg => createElement('div', {
                            class: `chat-message ${msg.senderId === player.id ? 'own' : ''}`,
                            key: `${msg.senderId}-${msg.timestamp}`
                        }, [
                            createElement('div', { class: 'message-header' }, [
                                createElement('span', { class: 'message-sender' }, [
                                    msg.senderId === player.id ? 'You' : msg.sender
                                ]),
                                createElement('span', { class: 'message-time' }, [
                                    new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                ])
                            ]),
                            createElement('div', { class: 'message-content' }, [msg.message])
                        ]))
                    ),

                    // Chat input form
                    createElement('form', {
                        class: 'chat-form',
                        onSubmit: handleSendMessage
                    }, [
                        createElement('input', {
                            id: 'chat-input',
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

        // Footer section
        createElement('div', { class: 'waiting-footer' }, [
            createElement('p', {}, [
                'Tip: Destroy blocks to find power-ups that increase your bombs, explosion range, or speed!'
            ])
        ])
    ]);
}

export default WaitingRoom;