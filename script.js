/* General page setup with dark naval theme */
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #0b132b;
  color: #edf2f4;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
}

header {
  text-align: center;
  padding: 1.5rem 1rem 0.5rem 1rem;
}

header h1 {
  margin: 0;
  color: #38bdf8;
  font-size: 2.2rem;
}

header p {
  color: #94a3b8;
  margin-top: 0.25rem;
}

main {
  width: 95%;
  max-width: 900px;
  margin: 1rem 0;
}

/* Card layout & display control */
.card {
  background-color: #1c2541;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  text-align: center;
}

/* Strict hidden utility class to prevent lobby/game elements from overlapping */
.hidden {
  display: none !important;
}

/* Lobby Layout */
.lobby-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.lobby-box {
  background-color: #0b132b;
  padding: 1.25rem;
  border-radius: 8px;
  flex: 1;
  min-width: 250px;
}

.code-display {
  font-family: monospace;
  font-size: 1.8rem;
  font-weight: bold;
  color: #38bdf8;
  letter-spacing: 3px;
  background-color: #1c2541;
  padding: 0.5rem;
  border-radius: 6px;
  margin: 0.5rem 0;
  user-select: all;
}

.small-text {
  font-size: 0.8rem;
  color: #94a3b8;
}

/* Form Controls & Buttons */
input[type="text"] {
  width: 80%;
  padding: 10px;
  font-size: 1.1rem;
  text-align: center;
  border-radius: 6px;
  border: 1px solid #3a506b;
  background-color: #1c2541;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 1rem;
}

button {
  background-color: #0284c7;
  color: #ffffff;
  border: none;
  padding: 10px 18px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
  margin: 0.25rem;
}

button:hover:not(:disabled) {
  background-color: #0369a1;
  transform: translateY(-2px);
}

button:disabled {
  background-color: #334155;
  color: #64748b;
  cursor: not-allowed;
}

/* Gameplay Section */
.status-heading {
  font-size: 1.4rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #38bdf8;
}

.boards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.board-wrapper h3 {
  margin-bottom: 0.5rem;
  color: #cbd5e1;
}

/* 10x10 Grid Boards */
.grid-board {
  display: grid;
  grid-template-columns: repeat(10, 30px);
  grid-template-rows: repeat(10, 30px);
  gap: 2px;
  background-color: #3a506b;
  padding: 4px;
  border-radius: 6px;
}

/* Individual Grid Cells */
.cell {
  width: 30px;
  height: 30px;
  background-color: #0b132b;
  border-radius: 2px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.cell:hover {
  background-color: #1c2541;
}

/* Battleship Cell States */
.cell.ship {
  background-color: #64748b;
}

.cell.hit {
  background-color: #ef4444 !important;
}

.cell.miss {
  background-color: #38bdf8 !important;
}

footer {
  margin-top: auto;
  padding: 1rem;
  font-size: 0.85rem;
  color: #64748b;
}
      const row = horizontal ? r : r + i;
      const col = horizontal ? c + i : c;
      if (myBoard[row][col] !== 0) return false;
    }
    return true;
  }

  // Ready Up button click handlerdocument.addEventListener('DOMContentLoaded', () => {

  const BOARD_SIZE = 10;
  // Ships fleet size: Carrier(5), Battleship(4), Cruiser(3), Submarine(3), Destroyer(2)
  const SHIPS = [5, 4, 3, 3, 2];

  let peer = null;
  let conn = null;
  let isHost = false;

  // Local & Game state tracking
  let myBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
  let myShipsPlaced = [];
  let currentShipIndex = 0;
  let isHorizontal = true;
  let isMyTurn = false;
  let myReady = false;
  let opponentReady = false;

  // DOM element selectors
  const lobbySection = document.getElementById('lobby');
  const gameWorkspace = document.getElementById('game-workspace');
  const connStatus = document.getElementById('connection-status');
  const myCodeDisplay = document.getElementById('my-code-display');
  const joinCodeInput = document.getElementById('join-code-input');
  const joinBtn = document.getElementById('join-btn');
  const turnStatus = document.getElementById('turn-status');
  const myBoardElem = document.getElementById('my-board');
  const enemyBoardElem = document.getElementById('enemy-board');
  const rotateBtn = document.getElementById('rotate-btn');
  const readyBtn = document.getElementById('ready-btn');

  // Generate a random 6-character room code
  function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Initialize PeerJS network connection
  function initPeer() {
    const customCode = generateRoomCode();
    // Using PeerJS public server
    peer = new Peer(customCode);

    peer.on('open', (id) => {
      myCodeDisplay.textContent = id;
      connStatus.textContent = "Online! Create a room or join one with a code.";
    });

    // Listen for incoming connection from Player 2
    peer.on('connection', (connection) => {
      conn = connection;
      isHost = true;
      isMyTurn = true; // Host shoots first
      setupDataListeners();
      switchToGameScreen();
    });

    peer.on('error', (err) => {
      alert("Network Error: " + err.type);
    });
  }

  // Join an existing game host using their room code
  joinBtn.addEventListener('click', () => {
    const targetCode = joinCodeInput.value.trim().toUpperCase();
    if (targetCode.length < 5) {
      alert("Please enter a valid room code!");
      return;
    }

    connStatus.textContent = "Connecting to host...";
    conn = peer.connect(targetCode);
    isHost = false;
    isMyTurn = false; // Joiner shoots second

    conn.on('open', () => {
      setupDataListeners();
      switchToGameScreen();
    });
  });

  // Handle incoming data messages over the Peer-to-Peer network
  function setupDataListeners() {
    conn.on('data', (data) => {
      handleNetworkMessage(data);
    });

    conn.on('close', () => {
      alert("Opponent disconnected!");
      location.reload();
    });
  }

  // Switch UI from Lobby to the Battleship Game Screen
  function switchToGameScreen() {
    lobbySection.classList.add('hidden');
    gameWorkspace.classList.remove('hidden');
    turnStatus.textContent = `Place your ship (Length: ${SHIPS[currentShipIndex]})`;
    renderGridBoards();
  }

  // Render initial 10x10 grids for both boards
  function renderGridBoards() {
    myBoardElem.innerHTML = '';
    enemyBoardElem.innerHTML = '';

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        // Player's board cell
        const myCell = document.createElement('div');
        myCell.classList.add('cell');
        myCell.dataset.row = r;
        myCell.dataset.col = c;
        myCell.addEventListener('click', () => placeShipSegment(r, c));
        myBoardElem.appendChild(myCell);

        // Enemy targeting board cell
        const enemyCell = document.createElement('div');
        enemyCell.classList.add('cell');
        enemyCell.dataset.row = r;
        enemyCell.dataset.col = c;
        enemyCell.addEventListener('click', () => handleAttack(r, c));
        enemyBoardElem.appendChild(enemyCell);
      }
    }
  }

  // Rotate ship direction button
  rotateBtn.addEventListener('click', () => {
    isHorizontal = !isHorizontal;
    rotateBtn.textContent = `Rotate Ship (${isHorizontal ? 'Horizontal' : 'Vertical'})`;
  });

  // Ship Placement Logic
  function placeShipSegment(r, c) {
    if (currentShipIndex >= SHIPS.length) return; // All ships already placed

    const shipLen = SHIPS[currentShipIndex];

    // Check if placement is inside bounds and doesn't overlap
    if (!canPlaceShip(r, c, shipLen, isHorizontal)) {
      alert("Invalid ship placement!");
      return;
    }

    // Place ship on internal board & update visual UI
    for (let i = 0; i < shipLen; i++) {
      const row = isHorizontal ? r : r + i;
      const col = isHorizontal ? c + i : c;
      myBoard[row][col] = 1;

      const cell = myBoardElem.querySelector(`[data-row='${row}'][data-col='${col}']`);
      cell.classList.add('ship');
    }

    currentShipIndex++;

    if (currentShipIndex < SHIPS.length) {
      turnStatus.textContent = `Place your ship (Length: ${SHIPS[currentShipIndex]})`;
    } else {
      turnStatus.textContent = "All ships placed! Click 'Ready Up!' when prepared.";
      rotateBtn.classList.add('hidden');
      readyBtn.disabled = false;
    }
  }

  // Verify if a ship fits without overlapping or going out of bounds
  function canPlaceShip(r, c, len, horizontal) {
    if (horizontal && c + len > BOARD_SIZE) return false;
    if (!horizontal && r + len > BOARD_SIZE) return false;

    for (let i = 0; i < len; i++) {
  readyBtn.addEventListener('click', () => {
    myReady = true;
    readyBtn.disabled = true;
    readyBtn.textContent = "Waiting for Opponent...";
    
    // Send network signal to opponent
    conn.send({ type: 'READY' });
    checkStartGame();
  });

  // Start match when both players are ready
  function checkStartGame() {
    if (myReady && opponentReady) {
      document.getElementById('setup-controls').classList.add('hidden');
      updateTurnBanner();
    }
  }

  // Attacking the enemy board
  function handleAttack(r, c) {
    if (!myReady || !opponentReady || !isMyTurn) return;

    const cell = enemyBoardElem.querySelector(`[data-row='${r}'][data-col='${c}']`);
    if (cell.classList.contains('hit') || cell.classList.contains('miss')) return; // Already attacked

    // Transmit attack payload to opponent over network
    conn.send({ type: 'ATTACK', row: r, col: c });
    isMyTurn = false;
    turnStatus.textContent = "Waiting for opponent's turn...";
  }

  // Network Message Dispatcher
  function handleNetworkMessage(data) {
    if (data.type === 'READY') {
      opponentReady = true;
      checkStartGame();
    } 
    else if (data.type === 'ATTACK') {
      // Opponent attacked us! Check if it's a Hit or Miss
      const isHit = myBoard[data.row][data.col] === 1;
      const targetCell = myBoardElem.querySelector(`[data-row='${data.row}'][data-col='${data.col}']`);
      targetCell.classList.add(isHit ? 'hit' : 'miss');

      // Reply back with the result
      conn.send({ type: 'ATTACK_RESULT', row: data.row, col: data.col, hit: isHit });

      // Check if all my ships are destroyed
      if (checkDefeat()) {
        conn.send({ type: 'GAME_OVER' });
        turnStatus.textContent = "❌ Defeat! All your ships were destroyed!";
      } else {
        isMyTurn = true;
        updateTurnBanner();
      }
    } 
    else if (data.type === 'ATTACK_RESULT') {
      // Opponent telling us if our attack was a Hit or Miss
      const targetCell = enemyBoardElem.querySelector(`[data-row='${data.row}'][data-col='${data.col}']`);
      targetCell.classList.add(data.hit ? 'hit' : 'miss');
    }
    else if (data.type === 'GAME_OVER') {
      turnStatus.textContent = "🎉 Victory! You sank all enemy battleships!";
    }
  }

  function updateTurnBanner() {
    turnStatus.textContent = isMyTurn ? "🎯 Your Turn: Pick a target on Enemy Waters!" : "⏳ Opponent's Turn: Stand by...";
  }

  function checkDefeat() {
    const shipCells = myBoardElem.querySelectorAll('.cell.ship');
    const hitShipCells = myBoardElem.querySelectorAll('.cell.ship.hit');
    return shipCells.length > 0 && shipCells.length === hitShipCells.length;
  }

  // Fire up network connection
  initPeer();
});
