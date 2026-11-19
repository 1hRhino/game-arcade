const boardEl = document.getElementById('board');
const statusText = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const historyNote = document.getElementById('history-note');

const ROWS = 6;
const COLS = 7;
let board = [];
let currentPlayer = 'red'; // 'red' or 'yellow'
let gameActive = true;

function createBoard() {
  board = [];
  for (let r = 0; r < ROWS; r++) {
    board.push(Array(COLS).fill(''));
  }
  boardEl.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'connect-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener('click', () => dropDisc(c));
      boardEl.appendChild(cell);
    }
  }
}

function render() {
  const cells = boardEl.children;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = cells[r * COLS + c];
      cell.classList.remove('red', 'yellow');
      if (board[r][c]) cell.classList.add(board[r][c]);
    }
  }
}

function saveGame(result) {
  const history = JSON.parse(localStorage.getItem('gameArcadeHistory') || '[]');
  history.push({
    game: 'Connect Four',
    result: result,
    date: new Date().toISOString()
  });
  localStorage.setItem('gameArcadeHistory', JSON.stringify(history));
  historyNote.textContent = 'Saved to your history (in this browser for now).';
}

function checkWinner(row, col) {
  const player = board[row][col];
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

  for (const [dr, dc] of directions) {
    let count = 1;
    // one way
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      count++;
      r += dr; c += dc;
    }
    // other way
    r = row - dr; c = col - dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      count++;
      r -= dr; c -= dc;
    }
    if (count >= 4) return true;
  }
  return false;
}

function dropDisc(col) {
  if (!gameActive) return;

  // Find lowest empty row in this column
  let row = -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === '') { row = r; break; }
  }
  if (row === -1) return; // column full

  board[row][col] = currentPlayer;
  render();

  if (checkWinner(row, col)) {
    const winner = currentPlayer === 'red' ? 'Red' : 'Yellow';
    statusText.textContent = winner + ' wins!';
    gameActive = false;
    saveGame(winner + ' wins');
    return;
  }

  if (board.flat().every(cell => cell !== '')) {
    statusText.textContent = "It's a draw!";
    gameActive = false;
    saveGame('Draw');
    return;
  }

  currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
  statusText.textContent = (currentPlayer === 'red' ? 'Red' : 'Yellow') + "'s turn — click a column to drop a disc";
}

restartBtn.addEventListener('click', () => {
  currentPlayer = 'red';
  gameActive = true;
  statusText.textContent = "Red's turn — click a column to drop a disc";
  historyNote.textContent = '';
  createBoard();
  render();
});

createBoard();
render();
