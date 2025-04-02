# Bomberman DOM

A multiplayer Bomberman game built using DOM manipulation and WebSockets, based on the mini-framework you created.

## Features

- Multiplayer gameplay with 2-4 players
- Real-time communication with WebSockets
- Chat functionality
- Power-ups: bombs, flames, speed
- Performance optimized for 60fps

## Requirements

- Node.js (v14 or higher recommended)
- npm (v6 or higher recommended)

## Project Structure

- `client/`: Frontend code (HTML, CSS, JavaScript)
    - `css/`: Stylesheets
    - `js/`: JavaScript files
        - `components/`: UI components
        - `utils/`: Utility functions
- `server/`: Backend code
    - `index.js`: Main server file
    - `gameManager.js`: Game logic manager
    - `playerManager.js`: Player management
    - `utils/`: Server utilities
- `src/`: Mini-framework source code

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd bomberman-dom
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Game

1. Start the server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

3. To play with multiple players, open the game in different browser windows or on different devices connected to the same network.

## Game Controls

- **Movement**: Arrow keys or WASD
- **Place bomb**: Space bar
- **Chat**: Type in the chat box and press Enter to send

## Game Rules

1. Each player starts with 3 lives
2. Players can place bombs to destroy blocks and other players
3. Destroyed blocks may reveal power-ups:
    - **Bomb**: Increases the number of bombs you can place at once
    - **Flame**: Increases explosion range
    - **Speed**: Increases movement speed
4. The last player standing wins!

## Development

For development with auto-restart on file changes:

```bash
npm run dev
```

## How it Works

1. **Login**: Enter a nickname to join the game
2. **Waiting Room**: Wait for 2-4 players to join
    - If 4 players join, the game starts with a 10-second countdown
    - If 2-3 players have joined and 20 seconds pass, a 10-second countdown starts
3. **Game**: Play until only one player remains
4. **Game Over**: The last player standing wins, and all players return to the waiting room

## Project Audit Criteria

The project passes all requirements specified in Audit.md:
- Nickname entry and waiting room with player counter
- Real-time chat functionality
- Game starts automatically based on player count
- Map with destroyable/non-destroyable blocks
- Power-ups that appear from destroyed blocks
- Performance optimization for 60fps

## License

ISC License