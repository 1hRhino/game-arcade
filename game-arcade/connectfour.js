const boardEl = document.getElementById('board');
const statusText = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const historyNote = document.getElementById('history-note');
const modeLabel = document.getElementById('mode-label');
const diffPicker = document.getElementById('difficulty-picker');

const ROWS = 6, COLS = 7;
let board = [];
let currentPlayer = 'red';
let gameActive = true;
let mode = 'friend';
let difficulty = 'easy';

function createBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(''));
  boardEl.innerHTML = '';
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const cell = document.createElement('div');
    cell.className = 'connect-cell';
    cell.dataset.row = r; cell.dataset.col = c;
    cell.addEventListener('click', () => {
      if (mode === 'computer' && currentPlayer === 'yellow') return;
      dropDisc(c);
    });

    boardEl.appendChild(cell);
  }
}
function render() {
  const cells = boardEl.children;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const cell = cells[r * COLS + c];
    cell.classList.remove('red', 'yellow');
    if (board[r][c]) cell.classList.add(board[r][c]);
  }
}
function saveGame(result) {
  const history = JSON.parse(localStorage.getItem('gameArcadeHistory') || '[]');
  history.push({ game: 'Connect Four', result, date: new Date().toISOString() });
  localStorage.setItem('gameArcadeHistory', JSON.stringify(history));
  historyNote.textContent = 'Saved to your history (in this browser for now).';
}
function nextRow(b, col) {
  for (let r = ROWS - 1; r >= 0; r--) if (b[r][col] === '') return r;
  return -1;
}
function winnerOnBoard(b, row, col) {
  const player = b[row][col];
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    let count = 1;
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && b[r][c] === player) { count++; r += dr; c += dc; }
    r = row - dr; c = col - dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && b[r][c] === player) { count++; r -= dr; c -= dc; }
    if (count >= 4) return true;
  }
  return false;
}
function validCols(b) {
  const cols = [];
  for (let c = 0; c < COLS; c++) if (b[0][c] === '') cols.push(c);
  return cols;
}
function scoreWindow(window, player) {
  const opp = player === 'red' ? 'yellow' : 'red';
  const pc = window.filter(v => v === player).length;
  const oc = window.filter(v => v === opp).length;
  const ec = window.filter(v => v === '').length;
  if (pc === 4) return 100000;
  if (pc === 3 && ec === 1) return 100;
  if (pc === 2 && ec === 2) return 10;
  if (oc === 3 && ec === 1) return -80;
  return 0;
}
function scoreBoard(b, player) {
  let score = 0;
  const centre = b.map(row => row[3]).filter(v => v === player).length;
  score += centre * 6;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS - 3; c++)
    score += scoreWindow([b[r][c], b[r][c+1], b[r][c+2], b[r][c+3]], player);
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS - 3; r++)
    score += scoreWindow([b[r][c], b[r+1][c], b[r+2][c], b[r+3][c]], player);
  for (let r = 0; r < ROWS - 3; r++) for (let c = 0; c < COLS - 3; c++)
    score += scoreWindow([b[r][c], b[r+1][c+1], b[r+2][c+2], b[r+3][c+3]], player);
  for (let r = 3; r < ROWS; r++) for (let c = 0; c < COLS - 3; c++)
    score += scoreWindow([b[r][c], b[r-1][c+1], b[r-2][c+2], b[r-3][c+3]], player);
  return score;
}
function minimax(b, depth, alpha, beta, maximizing) {
  const cols = validCols(b);
  if (depth === 0 || cols.length === 0) return scoreBoard(b, 'yellow') - scoreBoard(b, 'red');
  if (maximizing) {
    let best = -Infinity;
    for (const c of cols) {
      const copy = b.map(row => [...row]);
      const r = nextRow(copy, c); copy[r][c] = 'yellow';
      if (winnerOnBoard(copy, r, c)) return 1000000;
      best = Math.max(best, minimax(copy, depth - 1, alpha, beta, false));
      alpha = Math.max(alpha, best); if (alpha >= beta) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const c of cols) {
      const copy = b.map(row => [...row]);
      const r = nextRow(copy, c); copy[r][c] = 'red';
      if (winnerOnBoard(copy, r, c)) return -1000000;
      best = Math.min(best, minimax(copy, depth - 1, alpha, beta, true));
      beta = Math.min(beta, best); if (alpha >= beta) break;
    }
    return best;
  }
}
function findWinCol(b, player) {
  for (const c of validCols(b)) {
    const r = nextRow(b, c); b[r][c] = player;
    const win = winnerOnBoard(b, r, c); b[r][c] = ''; if (win) return c;
  }
  return -1;
}
function getComputerCol() {
  const cols = validCols(board);
  if (difficulty === 'easy') return cols[Math.floor(Math.random() * cols.length)];
  const win = findWinCol(board, 'yellow'); if (win !== -1) return win;
  const block = findWinCol(board, 'red'); if (block !== -1) return block;
  if (difficulty === 'medium') {
    const pref = [3, 2, 4, 1, 5, 0, 6].filter(c => cols.includes(c));
    return pref[0];
  }
  let bestScore = -Infinity, bestCol = cols[0];
  for (const c of cols) {
    const copy = board.map(row => [...row]);
    const r = nextRow(copy, c); copy[r][c] = 'yellow';
    const s = minimax(copy, 4, -Infinity, Infinity, false);
    if (s > bestScore) { bestScore = s; bestCol = c; }
  }
  return bestCol;
}
function dropDisc(col) {
  if (!gameActive) return;
  const row = nextRow(board, col);
  if (row === -1) return;
  board[row][col] = currentPlayer;
  render();
  if (winnerOnBoard(board, row, col)) {
    const winner = currentPlayer === 'red' ? 'Red' : 'Yellow';
    statusText.textContent = winner + ' wins!';
    gameActive = false; saveGame(winner + ' wins'); return;
  }
  if (board.flat().every(v => v !== '')) {
    statusText.textContent = "It's a draw!"; gameActive = false; saveGame('Draw'); return;
  }
  currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
  statusText.textContent = (currentPlayer === 'red' ? 'Red' : 'Yellow') + "'s turn";
  if (mode === 'computer' && currentPlayer === 'yellow' && gameActive) {
    statusText.textContent = "Computer is thinking...";
    setTimeout(() => { if (gameActive) dropDisc(getComputerCol()); }, 500);
  }
}
function resetGame() {
  currentPlayer = 'red'; gameActive = true;
  statusText.textContent = "Red's turn — click a column to drop a disc";
  historyNote.textContent = '';
  createBoard(); render();
}
restartBtn.addEventListener('click', resetGame);
document.getElementById('mode-friend').addEventListener('click', () => {
  mode = 'friend'; diffPicker.style.display = 'none';
  modeLabel.textContent = 'Mode: Play with a Friend'; resetGame();
});
document.getElementById('mode-computer').addEventListener('click', () => {
  mode = 'computer'; diffPicker.style.display = 'block';
  modeLabel.textContent = 'Mode: Play with Computer — ' + difficulty; resetGame();
});
document.querySelectorAll('.difficulty').forEach(btn => {
  btn.addEventListener('click', () => {
    difficulty = btn.dataset.diff;
    document.querySelectorAll('.difficulty').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    modeLabel.textContent = 'Mode: Play with Computer — ' + difficulty; resetGame();
  });
});
createBoard(); render();
