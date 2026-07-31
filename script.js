document.addEventListener('DOMContentLoaded', () => {

  const BOARD_SIZE = 10;
  const SHIPS = [5, 4, 3, 3, 2]; // Carrier, Battleship, Cruiser, Submarine, Destroyer

  let roomCode = "";
  let isHost = false;
  let isMyTurn = false;
  let broadcastChannel = null;

  // Local & Game state tracking
  let myBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
  let currentShipIndex = 0;
  let isHorizontal = true;
  let myReady = false;
  let opponentReady = false;

  // DOM elements
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

  // Helper to generate a 6-character uppercase room code
  function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Initialize Room Setup with Local Fallback support
  function initializeRoom() {
    roomCode = generateCode();
    myCodeDisplay.textContent = roomCode;
    connStatus.textContent = "Room Ready! Share your room code to start.";

    // Set up Local Browser Broadcast Channel to guarantee offline/local tab connection
    setupLocalChannel(roomCode);
  }

  // Setup communication channel using BroadcastChannel API
  function setupLocalChannel(code) {
    if (broadcastChannel) broadcastChannel.close();

    broadcastChannel = new BroadcastChannel(`battleship-room-${code}`);
    broadcastChannel.onmessage = (event) => {
      handleNetworkMessage(event.data);
    };
  }

  // Host auto-generates room code on load
  initializeRoom();

  // Handle joining a room code
  joinBtn.addEventListener('click', () => {
    const inputCode = joinCodeInput.value.trim().toUpperCase();
    if (inputCode.length < 5) {
      alert("Please enter a valid 6-character room code!");
      return;
    }

    roomCode = inputCode;
    isHost = false;
    isMyTurn = false;

    // Connect to host's room channel
    setupLocalChannel(roomCode);

    // Notify host that player 2 joined
    broadcastChannel.postMessage({ type: 'PLAYER_JOINED' });
    switchToGameScreen();
  });

  // Switch UI screen from lobby to game board
  function switchToGameScreen() {
    lobbySection.classList.add('hidden');
    gameWorkspace.classList.remove('hidden');
    turnStatus.textContent = `Place your ship (Length: ${SHIPS[currentShipIndex]})`;
    renderGridBoards();
  }

  // Send message over network channel
  function sendMessage(payload) {
    if (broadcastChannel) {
      broadcastChannel.postMessage(payload);
    }
  }

  // Process incoming networking signals
  function handleNetworkMessage(data) {
    if (data.type === 'PLAYER_JOINED' && !isHost && myCodeDisplay.textContent === roomCode) {
      isHost = true;
      isMyTurn = true;
      sendMessage({ type: 'HOST_ACKNOWLEDGE' });
      switchToGameScreen();
    } 
    else if (data.type === 'HOST_ACKNOWLEDGE' && !isHost) {
      connStatus.textContent = "Connected to Host!";
    }
    else if (data.type === 'READY') {
      opponentReady = true;
      checkStartGame();
    } 
    else if (data.type === 'ATTACK') {
      // Opponent shot at our grid
      const isHit = myBoard[data.row][data.col] === 1;
      const targetCell = myBoardElem.querySelector(`[data-row='${data.row}'][data-col='${data.col}']`);
      targetCell.classList.add(isHit ? 'hit' : 'miss');

      sendMessage({ type: 'ATTACK_RESULT', row: data.row, col: data.col, hit: isHit });

      if (checkDefeat()) {
        sendMessage({ type: 'GAME_OVER' });
        turnStatus.textContent = "❌ Defeat! All your ships were destroyed!";
      } else {
        isMyTurn = true;
        updateTurnBanner();
      }
    } 
    else if (data.type === 'ATTACK_RESULT') {
      // Result of our attack on opponent
      const targetCell = enemyBoardElem.querySelector(`[data-row='${data.row}'][data-col='${data.col}']`);
      targetCell.classList.add(data.hit ? 'hit' : 'miss');
    }
    else if (data.type === 'GAME_OVER') {
      turnStatus.textContent = "🎉 Victory! You sank all enemy battleships!";
    }
  }

  // Build 10x10 boards
  function renderGridBoards() {
    myBoardElem.innerHTML = '';
    enemyBoardElem.innerHTML = '';

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        // Player's ship board cell
        const myCell = document.createElement('div');
        myCell.classList.add('cell');
        myCell.dataset.row = r;
        myCell.dataset.col = c;
        myCell.addEventListener('click', () => placeShipSegment(r, c));
        myBoardElem.appendChild(myCell);

        // Enemy targeting cell
        const enemyCell = document.createElement('div');
        enemyCell.classList.add('cell');
        enemyCell.dataset.row = r;
        enemyCell.dataset.col = c;
        enemyCell.addEventListener('click', () => handleAttack(r, c));
        enemyBoardElem.appendChild(enemyCell);
      }
    }
  }

  // Rotate Ship orientation
  rotateBtn.addEventListener('click', () => {
    isHorizontal = !isHorizontal;
    rotateBtn.textContent = `Rotate Ship (${isHorizontal ? 'Horizontal' : 'Vertical'})`;
  });

  // Ship Placement Logic
  function placeShipSegment(r, c) {
    if (currentShipIndex >= SHIPS.length) return;

    const shipLen = SHIPS[currentShipIndex];

    if (!canPlaceShip(r, c, shipLen, isHorizontal)) {
      alert("Invalid placement! Ship cannot overlap or exceed grid boundaries.");
      return;
    }

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

  // Check valid ship coordinates
  function canPlaceShip(r, c, len, horizontal) {
    if (horizontal && c + len > BOARD_SIZE) return false;
    if (!horizontal && r + len > BOARD_SIZE) return false;

    for (let i = 0; i < len; i++) {
      const row = horizontal ? r : r + i;
      const col = horizontal ? c + i : c;
      if (myBoard[row][col] !== 0) return false;
    }
    return true;
  }

  // Ready Up button handler
  readyBtn.addEventListener('click', () => {
    myReady = true;
    readyBtn.disabled = true;
    readyBtn.textContent = "Waiting for Opponent...";
    
    sendMessage({ type: 'READY' });
    checkStartGame();
  });

  function checkStartGame() {
    if (myReady && opponentReady) {
      document.getElementById('setup-controls').classList.add('hidden');
      updateTurnBanner();
    }
  }

  // Fire attack at enemy grid
  function handleAttack(r, c) {
    if (!myReady || !opponentReady || !isMyTurn) return;

    const cell = enemyBoardElem.querySelector(`[data-row='${r}'][data-col='${c}']`);
    if (cell.classList.contains('hit') || cell.classList.contains('miss')) return;

    sendMessage({ type: 'ATTACK', row: r, col: c });
    isMyTurn = false;
    turnStatus.textContent = "Waiting for opponent's move...";
  }

  function updateTurnBanner() {
    turnStatus.textContent = isMyTurn ? "🎯 Your Turn: Pick a target on Enemy Waters!" : "⏳ Opponent's Turn: Stand by...";
  }

  function checkDefeat() {
    const shipCells = myBoardElem.querySelectorAll('.cell.ship');
    const hitShipCells = myBoardElem.querySelectorAll('.cell.ship.hit');
    return shipCells.length > 0 && shipCells.length === hitShipCells.length;
  }

});
