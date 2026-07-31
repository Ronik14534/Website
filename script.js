// Wait until HTML document is fully loaded before running game logic
document.addEventListener('DOMContentLoaded', () => {

  const ROWS = 6;
  const COLS = 7;
  let boardState = []; // 2D array tracking board contents (null, 'red', or 'yellow')
  let currentPlayer = 'red'; // Game starts with Red player
  let gameActive = true;

  const boardElement = document.getElementById('board');
  const statusElement = document.getElementById('status');
  const resetBtn = document.getElementById('reset-btn');

  // Initialize and render the game board
  function initBoard() {
    boardElement.innerHTML = '';
    boardState = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    gameActive = true;
    currentPlayer = 'red';
    updateStatusText();

    // Dynamically build 6x7 grid of cell elements
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = r;
        cell.dataset.col = c;
        // Clicking any cell triggers a drop in that column
        cell.addEventListener('click', () => handleColumnClick(c));
        boardElement.appendChild(cell);
      }
    }
  }

  // Handle dropping a piece into the selected column
  function handleColumnClick(col) {
    if (!gameActive) return;

    // Gravity effect: Find the lowest empty row in the clicked column
    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!boardState[r][col]) {
        targetRow = r;
        break;
      }
    }

    // Column is full, ignore click
    if (targetRow === -1) return;

    // Update internal state and DOM grid
    boardState[targetRow][col] = currentPlayer;
    const targetCell = document.querySelector(`.cell[data-row='${targetRow}'][data-col='${col}']`);
    targetCell.classList.add(currentPlayer);

    // Check if this move wins the game
    if (checkWin(targetRow, col)) {
      gameActive = false;
      const winnerName = currentPlayer === 'red' ? 'Red' : 'Yellow';
      const winnerClass = currentPlayer === 'red' ? 'red-turn' : 'yellow-turn';
      statusElement.innerHTML = `🎉 Player <span class="${winnerClass}">${winnerName}</span> Wins!`;
      return;
    }

    // Check for a draw (if board is full)
    if (boardState.every(row => row.every(cell => cell !== null))) {
      gameActive = false;
      statusElement.textContent = "It's a Draw! 🤝";
      return;
    }

    // Switch active player
    currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
    updateStatusText();
  }

  // Update status heading to show whose turn it is
  function updateStatusText() {
    const playerText = currentPlayer === 'red' ? 'Red' : 'Yellow';
    const playerClass = currentPlayer === 'red' ? 'red-turn' : 'yellow-turn';
    statusElement.innerHTML = `Player <span class="${playerClass}">${playerText}</span>'s Turn`;
  }

  // Check 4 directional vectors for 4 matching connected pieces
  function checkWin(row, col) {
    const directions = [
      [[0, 1], [0, -1]],   // Horizontal
      [[1, 0], [-1, 0]],   // Vertical
      [[1, 1], [-1, -1]],  // Diagonal Down-Right / Up-Left
      [[1, -1], [-1, 1]]   // Diagonal Down-Left / Up-Right
    ];

    for (let dir of directions) {
      let count = 1;

      for (let [dr, dc] of dir) {
        let r = row + dr;
        let c = col + dc;

        while (r >= 0 && r < ROWS && c >= 0 && c < COLS && boardState[r][c] === currentPlayer) {
          count++;
          r += dr;
          c += dc;
        }
      }

      if (count >= 4) return true;
    }
    return false;
  }

  // Reset board on button click
  resetBtn.addEventListener('click', initBoard);

  // Initialize game on load
  initBoard();
});
