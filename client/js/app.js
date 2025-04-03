/**
 * Bomberman DOM - Main Client Application
 */
import {
    createApp,
    setState,
    getState,
    createElement
} from '../../src/index.js';

import { initSocket } from './socket.js';
import LoginScreen from "./components/LoginScreen.js";
import WaitingRoom from "./components/WaitingRoom.js";
import Game from "./components/Game.js";

// Initialize application state
setState({
    screen: 'login',
    player: {
        id: null,
        nickname: '',
    },
    waitingRoom: {
        players: [],
        countdown: null,
        playersCount: 0,
        chatMessages: []
    },
    game: {
        id: null,
        players: [],
        map: null,
        bombs: [],
        powerUps: [],
        explosions: [],
        chatMessages: []
    },
    performance: {
        fps: 0
    }
});

// Initialize WebSocket connection
initSocket();

// Root App Component
function App(state) {
    // Return different screens based on the current state
    switch (state.screen) {
        case 'login':
            return LoginScreen();
        case 'waiting':
            return WaitingRoom();
        case 'game':
            return Game();
        default:
            return LoginScreen();
    }
}

// Create and mount the app
const app = createApp(App);