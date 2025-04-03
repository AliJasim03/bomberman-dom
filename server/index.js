/**
 * Bomberman DOM - Server
 * WebSocket server that manages game state and player connections
 */
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');
const GameManager = require('./gameManager');

// Create Express app
const app = express();
app.use(express.static(path.join(__dirname, '../client')));

//serve mini framework
app.use('/src', express.static(path.join(__dirname, '../src')));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Initialize game manager
const gameManager = new GameManager();

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New client connected');

    // Assign a temporary ID to the connection
    ws.id = Math.random().toString(36).substr(2, 9);
    ws.isAlive = true;

    // Handle ping-pong to detect disconnected clients
    ws.on('pong', () => {
        ws.isAlive = true;
    });

    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'JOIN':
                    // Handle player joining
                    gameManager.addPlayer(ws, data.nickname);
                    break;

                case 'CHAT':
                    // Handle chat message
                    console.log(`Received chat message from ${ws.id}: ${data.message}`);

                    // Important: Use the player ID stored on the WebSocket, not the socket ID
                    if (ws.playerId) {
                        gameManager.broadcastChat(ws.playerId, data.message);
                    } else {
                        console.error(`WebSocket ${ws.id} tried to send chat but has no playerId`);
                    }
                    break;

                case 'PLAYER_MOVE':
                    // Handle player movement
                    gameManager.updatePlayerPosition(ws.playerId || ws.id, data.direction);
                    break;

                case 'PLACE_BOMB':
                    // Handle bomb placement
                    gameManager.placeBomb(ws.playerId || ws.id);
                    break;

                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    // Handle disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
        gameManager.removePlayer(ws.id);
    });
});

// Heartbeat interval to detect disconnected clients
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            gameManager.removePlayer(ws.id);
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

// Stop the heartbeat interval when the server closes
wss.on('close', () => {
    clearInterval(interval);
});

// Start game check interval
setInterval(() => {
    gameManager.checkGameStart();
}, 1000);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});