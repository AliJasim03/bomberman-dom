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
    const { player } = getState();

    /**
     * Handle login form submission
     * @param {Event} e - Form submission event
     */
    const handleSubmit = (e) => {
        e.preventDefault();

        // Get form input value
        const nicknameInput = document.getElementById('nickname-input');
        const nickname = nicknameInput.value.trim();

        // Validate nickname
        if (!nickname) {
            alert('Please enter a nickname');
            return;
        }

        if (nickname.length < 3 || nickname.length > 15) {
            alert('Nickname must be between 3 and 15 characters');
            return;
        }

        // Update player state
        setState({
            player: {
                ...player,
                nickname
            }
        });

        // Send join message to server
        if (window.socket && window.socket.readyState === WebSocket.OPEN) {
            window.socket.send(JSON.stringify({
                type: 'JOIN',
                nickname
            }));
        } else {
            alert('Connection to server not established. Please refresh the page.');
        }
    };

    return createElement('div', { class: 'login-container' }, [
        createElement('div', { class: 'login-card' }, [
            createElement('h1', { class: 'game-title' }, ['BombermanDOM']),

            createElement('form', {
                class: 'login-form',
                onSubmit: handleSubmit
            }, [
                createElement('div', { class: 'form-group' }, [
                    createElement('label', { for: 'nickname-input' }, ['Enter your nickname:']),
                    createElement('input', {
                        id: 'nickname-input',
                        type: 'text',
                        class: 'nickname-input',
                        placeholder: 'Your nickname',
                        autofocus: true,
                        required: true,
                        minlength: 3,
                        maxlength: 15
                    })
                ]),

                createElement('button', {
                    type: 'submit',
                    class: 'join-button'
                }, ['Join Game'])
            ]),

            createElement('div', { class: 'instructions' }, [
                createElement('h2', {}, ['How to Play:']),
                createElement('ul', {}, [
                    createElement('li', {}, ['Use arrow keys or WASD to move']),
                    createElement('li', {}, ['Press SPACE to place bombs']),
                    createElement('li', {}, ['Destroy blocks to find power-ups']),
                    createElement('li', {}, ['Be the last player standing to win!'])
                ])
            ])
        ])
    ]);
}

export default LoginScreen;