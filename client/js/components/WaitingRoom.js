/**
 * Waiting Room Component
 * Shows waiting players and countdown until game starts
 */
import { createElement, getState } from '../../../src/index.js';
import Chat from './Chat.js';

/**
 * Waiting Room Component
 * @returns {Object} Virtual DOM element
 */
function WaitingRoom() {
    const { player, waitingRoom } = getState();
    const { players, countdown, playersCount } = waitingRoom;

    // Format countdown timer
    const countdownDisplay = countdown !== null
        ? `Game starting in: ${countdown}s`
        : playersCount >= 2
            ? 'Waiting for more players...'
            : 'Waiting for at least one more player to join...';

    // Get chat messages
    const chatMessages = waitingRoom.chatMessages || [];

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

                // Countdown display
                createElement('div', {
                    class: `countdown ${countdown !== null ? 'active' : ''}`
                }, [countdownDisplay])
            ]),

            // Chat section
            createElement('div', { class: 'chat-section' }, [
                createElement(Chat, {
                    messages: chatMessages,
                    onSendMessage: handleSendMessage,
                    currentUserId: player.id
                })
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