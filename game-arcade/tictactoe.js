const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const historyNote = document.getElementById('history-note');
const modeLabel = document.getElementById('mode-label');
const diffPicker = document.getElementById('difficulty-picker');

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let mode = 'friend'; // 'friend' or 'computer'
let difficulty = 'easy';

const winCombos = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function saveGame(result) {
  const history = JSON.parse(localStorage.getItem('gameArcadeHistory') || '[]');
  history.push({ game: 'Tic-Tac-Toe', result, date: new Date().toISOString() });
  localStorage.setItem('gameArcadeHistory', JSON.stringify(history));
  historyNote.textContent = 'Saved to your history (in this browser for now).';
}

function winnerOn(b) {
  for (const [a, c, d] of winCombos) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return null;
}

function minimax(b, isMax) {
  const w = winnerOn(b);
  if (w === 'O') return 10;
  if (w === 'X') return -10;
  if (!b.includes('')) return 0;
  if (isMax) {
    let best = -Infinity;
    b.forEach((v, i) => { if (!v) { b[i] = 'O'; best = Math.max(best, minimax(b, false)); b[i] = ''; } });
    return best;
  } else {
    let best = Infinity;
    b.forEach((v, i) => { if (!v) { b[i] = 'X'; best = Math.min(best, minimax(b, true)); b[i] = ''; } });
    return best;
  }
}

function getComputerMove() {
  const empty = board.map((v, i) => v === '' ? i : null).filter(v => v !== null);
  if (difficulty === 'easy') return empty[Math.floor(Math.random() * empty.length)];
  // Medium: win, then block, else random
  for (const i of empty) { board[i] = 'O'; if (winnerOn(board) === 'O') { board[i] = ''; return i; } board[i] = ''; }
  for (const i of empty) { board[i] = 'X'; if (winnerOn(board) === 'X') { board[i] = ''; return i; } board[i] = ''; }
  if (difficulty === 'medium') return empty[Math.floor(Math.random() * empty.length)];
  // Hard: minimax
  let bestScore = -Infinity, bestMove = empty[0];
  for (const i of empty) { board[i] = 'O'; const s = minimax(board, false); board[i] = ''; if (s > bestScore) { bestScore = s; bestMove = i; } }
  return bestMove;
}

function placeMove(index, player) {
  board[index] = player;
  cells[index].textContent = player;
  const winner = winnerOn(board);
  if (winner) {
    statusText.textContent = winner + ' wins!';
    gameActive = false;
    saveGame(winner + ' wins');
    return;
  }
  if (!board.includes('')) {
    statusText.textContent = "It's a draw!";
    gameActive = false;
    saveGame('Draw');
    return;
  }
  currentPlayer = player === 'X' ? 'O' : 'X';
  statusText.textContent = currentPlayer + "'s turn";
  if (mode === 'computer' && currentPlayer === 'O' && gameActive) {
    statusText.textContent = "Computer is thinking...";
    setTimeout(() => { if (!gameActive) return; placeMove(getComputerMove(), 'O'); }, 500);
  }
}

cells.forEach(cell => {
  cell.addEventListener('click', () => {
    if (!gameActive || board[cell.dataset.index] !== '') return;
    if (mode === 'computer' && currentPlayer === 'O') return;
    placeMove(Number(cell.dataset.index), currentPlayer);
  });
});

function resetGame() {
  board = ['', '', '', '', '', '', '', '', ''];
  currentPlayer = 'X';
  gameActive = true;
  statusText.textContent = "X's turn";
  historyNote.textContent = '';
  cells.forEach(cell => cell.textContent = '');
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
    modeLabel.textContent = 'Mode: Play with Computer — ' + difficulty;
    resetGame();
  });
});
