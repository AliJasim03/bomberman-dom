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

        // Save nickname to localStorage
        localStorage.setItem('bomberman-session', JSON.stringify({
            nickname: nickname
        }));

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
                        value: storedNickname, // Use the stored nickname
                        autofocus: true
                    })
                ]),

                createElement('button', {
                    type: 'submit',
                    class: 'join-button'
                }, ['Join Game'])
            ]),

            createElement('div', { class: 'instructions' }, [
                createElement('p', {}, ['Use arrow keys to move, spacebar to place bombs'])
            ])
        ])
    ]);
}

export default LoginScreen;