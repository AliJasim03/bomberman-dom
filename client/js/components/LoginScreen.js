/**
 * Login Screen Component
 * Allows the user to enter a nickname and join the game
 */
import { createElement, getState, setState } from '../../../src/index.js';

/**
 * Login Screen Component
 * @returns {Object} Virtual DOM element
 */
function LoginScreen() {
    const {player, reconnecting} = getState();
    const storedNickname = player.nickname || '';

    const handleSubmit = (e) => {
        e.preventDefault();

        const nicknameInput = document.getElementById('nickname-input');
        const nickname = nicknameInput.value.trim();

        if (!nickname) {
            alert('Please enter a nickname');
            return;
        }

        setState({
            player: {
                ...getState().player,
                nickname
            }
        });

        // If we're reconnecting, the reconnection is handled in app.js/socket.js
        // If not, send a normal JOIN request
        if (!reconnecting) {
            if (window.socket && window.socket.readyState === WebSocket.OPEN) {
                window.socket.send(JSON.stringify({
                    type: 'JOIN',
                    nickname
                }));

                // Save nickname to localStorage (useful if server restarts)
                localStorage.setItem('bomberman-session', JSON.stringify({
                    nickname
                }));
            } else {
                alert('Connection to server not established. Please refresh the page.');
            }
        } else {
            // For reconnection, we update the nickname and attempt to reconnect
            if (window.socket && window.socket.readyState === WebSocket.OPEN) {
                window.socket.send(JSON.stringify({
                    type: 'RECONNECT',
                    playerId: player.id,
                    nickname
                }));
            } else {
                alert('Connection to server not established. Please refresh the page.');
            }
        }
    };

    // Render a message if reconnecting
    const reconnectingMessage = reconnecting ?
        createElement('div', {class: 'reconnecting-message'}, [
            'Attempting to reconnect with your previous session...'
        ]) : null;

    return createElement('div', {class: 'login-container'}, [
        createElement('div', {class: 'login-card'}, [
            createElement('h1', {class: 'game-title'}, ['BombermanDOM']),

            reconnectingMessage,

            createElement('form', {
                class: 'login-form',
                onSubmit: handleSubmit
            }, [
                createElement('div', {class: 'form-group'}, [
                    createElement('label', {for: 'nickname-input'}, ['Enter your nickname:']),
                    createElement('input', {
                        id: 'nickname-input',
                        type: 'text',
                        class: 'nickname-input',
                        placeholder: 'Your nickname',
                        value: storedNickname, // Use the stored nickname
                        autofocus: true
                    })
                ]),

                createElement('button', {
                    type: 'submit',
                    class: 'join-button'
                }, [reconnecting ? 'Reconnect' : 'Join Game'])
            ]),

            createElement('div', {class: 'instructions'}, [
                createElement('h2', {}, ['How to Play']),
                createElement('ul', {}, [
                    createElement('li', {}, ['Use arrow keys or WASD to move']),
                    createElement('li', {}, ['Press spacebar to place bombs']),
                    createElement('li', {}, ['Destroy blocks to find power-ups']),
                    createElement('li', {}, ['Eliminate other players to win'])
                ])
            ])
        ])
    ]);
}

export default LoginScreen;