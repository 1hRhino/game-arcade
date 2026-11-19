const boardEl = document.getElementById('board');
const statusText = document.getElementById('status');
const movesEl = document.getElementById('moves');
const timeEl = document.getElementById('time');
const restartBtn = document.getElementById('restart');
const historyNote = document.getElementById('history-note');

const SOLVED = [1, 2, 3, 4, 5, 6, 7, 8, ''];
let tiles = [...SOLVED];
let moves = 0;
let seconds = 0;
let timer = null;
let gameActive = true;

function render() {
  boardEl.innerHTML = '';
  tiles.forEach((tile, i) => {
    const div = document.createElement('div');
    div.className = tile === '' ? 'puzzle-tile blank' : 'puzzle-tile';
    div.textContent = tile;
    div.addEventListener('click', () => moveTile(i));
    boardEl.appendChild(div);
  });
  movesEl.textContent = moves;
  timeEl.textContent = seconds;
}

function isAdjacent(i, blank) {
  const r1 = Math.floor(i / 3), c1 = i % 3;
  const r2 = Math.floor(blank / 3), c2 = blank % 3;
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

function startTimer() {
  if (timer) return;
  timer = setInterval(() => { seconds++; timeEl.textContent = seconds; }, 1000);
}

function moveTile(i) {
  if (!gameActive) return;
  const blank = tiles.indexOf('');
  if (!isAdjacent(i, blank)) return;
  startTimer();
  [tiles[i], tiles[blank]] = [tiles[blank], tiles[i]];
  moves++;
  render();
  if (tiles.join(',') === SOLVED.join(',')) {
    gameActive = false;
    clearInterval(timer);
    statusText.textContent = `Solved in ${moves} moves and ${seconds} seconds!`;
    const history = JSON.parse(localStorage.getItem('gameArcadeHistory') || '[]');
    history.push({ game: 'Puzzle', result: `Solved in ${moves} moves, ${seconds}s`, date: new Date().toISOString() });
    localStorage.setItem('gameArcadeHistory', JSON.stringify(history));
    historyNote.textContent = 'Saved to your history (in this browser for now).';
  }
}

function shuffle() {
  tiles = [...SOLVED];
  // Shuffle with random valid slides so it's always solvable
  for (let n = 0; n < 100; n++) {
    const blank = tiles.indexOf('');
    const options = [];
    [blank - 3, blank + 3, blank - 1, blank + 1].forEach(i => {
      if (i >= 0 && i < 9 && isAdjacent(i, blank)) options.push(i);
    });
    const pick = options[Math.floor(Math.random() * options.length)];
    [tiles[pick], tiles[blank]] = [tiles[blank], tiles[pick]];
  }
  moves = 0; seconds = 0; gameActive = true;
  clearInterval(timer); timer = null;
  statusText.textContent = 'Click a tile next to the empty space to slide it. Get 1-8 in order.';
  historyNote.textContent = '';
  render();
}

restartBtn.addEventListener('click', shuffle);
shuffle();
