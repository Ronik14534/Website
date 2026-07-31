document.addEventListener('DOMContentLoaded', () => {

  const BOARD_SIZE = 10;
  const SHIPS = [5, 4, 3, 3, 2]; // Carrier, Battleship, Cruiser, Submarine, Destroyer

  let roomCode = "";
  let isHost = false;
  let isMyTurn = false;
  let broadcastChannel = null;
  let gameStarted = false;

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
  const readinessBanner = document.getElementById('readiness-banner');
  const myBoardElem = document.getElementById('my-board');
  const enemyBoardElem = document.getElementById('enemy-board');
  const rotateBtn = document.getElementById('rotate-btn');
  const readyBtn = document.getElementById('ready-btn');

  // Helper to generate a 6-character room code
  function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Initialize Room Setup
  function initializeRoom() {
    roomCode = generateCode();
    myCodeDisplay.textContent = roomCode;
    connStatus.textContent = "Room Ready! Share your room code to start.";
    setupLocalChannel(roomCode);
  }

  // Set up communication channel using BroadcastChannel API
  function setupLocalChannel(code) {
    if (broadcastChannel) broadcastChannel.close();

    broadcastChannel = new BroadcastChannel(`battleship-room-${code}`);
    broadcastChannel.onmessage = (event) => {
      handleNetworkMessage(event.data);
    };
  }

  // Auto-generate room code on load
  initializeRoom();

  // Handle joining a room code
  joinBtn.addEventListener('click', () => {
    const inputCode = joinCodeInput.value.trim().toUpperCase();
    if (inputCode.length < 5) {
      alert("Please enter a valid room code!");
      return;
    }

    roomCode = inputCode;
    isHost = false;
    isMyTurn = false;

    setupLocalChannel(roomCode);

    // Broadcast join request to Host
    sendMessage({ type: 'PLAYER_JOINED' });
    switchToGameScreen();
  });

  // Switch UI screen from lobby to game board
  function switchToGameScreen() {
    lobbySection.classList.add('hidden');
    gameWorkspace.classList.remove('hidden');
    turnStatus.textContent = `Place your ship (Length: ${SHIPS[currentShipIndex]})`;
    readinessBanner.textContent = "Placement Phase";
    renderGridBoards();
  }

  // Send message over channel
  function sendMessage(payload) {
    if (broadcastChannel) {
      broadcastChannel.postMessage(payload);
    }
  }

  // Process incoming networking signals
  function handleNetworkMessage(data) {
    if (data.type === 'PLAYER_JOINED') {
      // Host accepts player 2
      if (!isHost && myCodeDisplay.textContent === roomCode) {
        isHost = true;
        isMyTurn = true; // Host shoots first
        sendMessage({ type: 'HOST_ACKNOWLEDGE' });
        switchToGameScreen();
      }
    } 
    else if (data.type === 'HOST_ACKNOWLEDGE') {
      connStatus.textContent = "Connected to Host!";
    }
    else if (data.type === 'PLAYER_READY') {
      // Opponent clicked Ready Up!
      opponentReady = true;
      readinessBanner.textContent = "⚡ Opponent is READY!";
      checkBothReady();
    }
    else if (data.type === 'START_GAME') {
      // Synchronized game start command
      startGameSession();
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
        readinessBanner.textContent = "Game Over";
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
      readinessBanner.textContent = "Game Over";
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
    if (gameStarted || currentShipIndex >= SHIPS.length) return;

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
    readinessBanner.textContent = "⏳ You are READY!";

    // Broadcast READY state to opponent
    sendMessage({ type: 'PLAYER_READY' });
    checkBothReady();
  });

  // Check if both players are ready and trigger match start
  function checkBothReady() {
    if (myReady && opponentReady) {
      // Broadcast START_GAME to sync both sides
      sendMessage({ type: 'START_GAME' });
      startGameSession();
    }
  }

  // Lock placement controls and start the battle
  function startGameSession() {
    gameStarted = true;
    document.getElementById('setup-controls').classList.add('hidden');
    readinessBanner.textContent = "⚔️ BATTLE IN PROGRESS";
    updateTurnBanner();
  }

  // Fire attack at enemy grid
  function handleAttack(r, c) {
    if (!gameStarted || !isMyTurn) return;

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
