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
    return createElement('div', { class: 'game-container' }, [
        createElement('h1', { class: 'game-title' }, ['Game is starting...']),
        createElement('p', {}, ['Loading game...'])
    ]);
}

export default Game;