const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const historyNote = document.getElementById('history-note');

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;

const winCombos = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function saveGame(result) {
  const history = JSON.parse(localStorage.getItem('gameArcadeHistory') || '[]');
  history.push({
    game: 'Tic-Tac-Toe',
    result: result,
    date: new Date().toISOString()
  });
  localStorage.setItem('gameArcadeHistory', JSON.stringify(history));
  historyNote.textContent = 'Saved to your history (in this browser for now).';
}

function checkWinner() {
  for (const combo of winCombos) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

cells.forEach(cell => {
  cell.addEventListener('click', () => {
    const index = cell.dataset.index;
    if (!gameActive || board[index] !== '') return;

    board[index] = currentPlayer;
    cell.textContent = currentPlayer;

    const winner = checkWinner();
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

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    statusText.textContent = currentPlayer + "'s turn";
  });
});

restartBtn.addEventListener('click', () => {
  board = ['', '', '', '', '', '', '', '', ''];
  currentPlayer = 'X';
  gameActive = true;
  statusText.textContent = "X's turn";
  historyNote.textContent = '';
  cells.forEach(cell => cell.textContent = '');
});
