const boardEl = document.getElementById('board');
const statusText = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const historyNote = document.getElementById('history-note');
const modeLabel = document.getElementById('mode-label');
const diffPicker = document.getElementById('difficulty-picker');

const SYMBOLS = { K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙', k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟' };
const VALUES = { p:100, n:320, b:330, r:500, q:900, k:20000 };
let board, currentPlayer, selected, legalMoves, gameActive;
let mode = 'friend';
let difficulty = 'easy';

function initialBoard() {
  return [
    ['r','n','b','q','k','b','n','r'], ['p','p','p','p','p','p','p','p'],
    ['','','','','','','',''], ['','','','','','','',''],
    ['','','','','','','',''], ['','','','','','','',''],
    ['P','P','P','P','P','P','P','P'], ['R','N','B','Q','K','B','N','R'],
  ];
}
function isWhite(p) { return p && p === p.toUpperCase(); }
function isBlack(p) { return p && p === p.toLowerCase(); }
function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
function isOpponent(r, c, white) { const p = board[r][c]; return p && (white ? isBlack(p) : isWhite(p)); }

function getMoves(r, c) {
  const piece = board[r][c]; if (!piece) return [];
  const white = isWhite(piece); const type = piece.toLowerCase(); const moves = [];
  const add = (nr, nc) => {
    if (!inBounds(nr, nc)) return false;
    if (!board[nr][nc]) { moves.push([nr, nc]); return true; }
    if (isOpponent(nr, nc, white)) { moves.push([nr, nc]); return false; }
    return false;
  };
  const slide = (dirs) => {
    for (const [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc;
      while (inBounds(nr, nc)) { if (!add(nr, nc)) break; if (board[nr][nc]) break; nr += dr; nc += dc; }
    }
  };
  if (type === 'p') {
    const dir = white ? -1 : 1; const startRow = white ? 6 : 1;
    if (inBounds(r + dir, c) && !board[r + dir][c]) {
      moves.push([r + dir, c]);
      if (r === startRow && !board[r + dir * 2][c]) moves.push([r + dir * 2, c]);
    }
    for (const dc of [-1, 1]) if (inBounds(r + dir, c + dc) && isOpponent(r + dir, c + dc, white)) moves.push([r + dir, c + dc]);
  }
  if (type === 'n') for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])
    if (inBounds(r + dr, c + dc) && (!board[r + dr][c + dc] || isOpponent(r + dr, c + dc, white))) moves.push([r + dr, c + dc]);
  if (type === 'r') slide([[-1,0],[1,0],[0,-1],[0,1]]);
  if (type === 'b') slide([[-1,-1],[-1,1],[1,-1],[1,1]]);
  if (type === 'q') slide([[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]);
  if (type === 'k') for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]])
    if (inBounds(r + dr, c + dc) && (!board[r + dr][c + dc] || isOpponent(r + dr, c + dc, white))) moves.push([r + dr, c + dc]);
  return moves;
}
function getAllMoves(whiteTurn) {
  const all = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (p && ((whiteTurn && isWhite(p)) || (!whiteTurn && isBlack(p)))) {
      for (const [nr, nc] of getMoves(r, c)) all.push({ from: [r, c], to: [nr, nc], captured: board[nr][nc] });
    }
  }
  return all;
}
function evaluateBoard() {
  let score = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c]; if (!p) continue;
    const v = VALUES[p.toLowerCase()] || 0;
    score += isWhite(p) ? v : -v;
  }
  return score;
}
function minimaxChess(depth, maximizing, alpha, beta) {
  if (depth === 0) return evaluateBoard();
  const moves = getAllMoves(maximizing);
  if (moves.length === 0) return evaluateBoard();
  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      const [sr, sc] = m.from, [tr, tc] = m.to;
      const captured = board[tr][tc]; const piece = board[sr][sc];
      board[tr][tc] = piece; board[sr][sc] = '';
      best = Math.max(best, minimaxChess(depth - 1, false, alpha, beta));
      board[sr][sc] = piece; board[tr][tc] = captured;
      alpha = Math.max(alpha, best); if (alpha >= beta) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      const [sr, sc] = m.from, [tr, tc] = m.to;
      const captured = board[tr][tc]; const piece = board[sr][sc];
      board[tr][tc] = piece; board[sr][sc] = '';
      best = Math.min(best, minimaxChess(depth - 1, true, alpha, beta));
      board[sr][sc] = piece; board[tr][tc] = captured;
      beta = Math.min(beta, best); if (alpha >= beta) break;
    }
    return best;
  }
}
function getComputerMove() {
  const moves = getAllMoves(false); // black to move
  if (!moves.length) return null;
  if (difficulty === 'easy') return moves[Math.floor(Math.random() * moves.length)];
  if (difficulty === 'medium') {
    let best = moves[0], bestVal = -1;
    for (const m of moves) {
      const v = m.captured ? (VALUES[m.captured.toLowerCase()] || 0) : 0;
      if (v > bestVal) { bestVal = v; best = m; }
    }
    return bestVal > 0 ? best : moves[Math.floor(Math.random() * moves.length)];
  }
  // Hard: minimax depth 2, black minimises
  let best = moves[0], bestScore = Infinity;
  for (const m of moves) {
    const [sr, sc] = m.from, [tr, tc] = m.to;
    const captured = board[tr][tc]; const piece = board[sr][sc];
    board[tr][tc] = piece; board[sr][sc] = '';
    const s = minimaxChess(1, true, -Infinity, Infinity);
    board[sr][sc] = piece; board[tr][tc] = captured;
    if (s < bestScore) { bestScore = s; best = m; }
  }
  return best;
}
function render() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const cell = document.createElement('div');
    cell.className = 'chess-cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
    const piece = board[r][c];
    if (piece) { cell.textContent = SYMBOLS[piece]; cell.classList.add(isWhite(piece) ? 'white-piece' : 'black-piece'); }
    if (selected && selected[0] === r && selected[1] === c) cell.classList.add('selected');
    if (legalMoves.some(([mr, mc]) => mr === r && mc === c)) cell.classList.add('legal');
    cell.addEventListener('click', () => onCellClick(r, c));
    boardEl.appendChild(cell);
  }
}
function saveGame(result) {
  const history = JSON.parse(localStorage.getItem('gameArcadeHistory') || '[]');
  history.push({ game: 'Chess', result, date: new Date().toISOString() });
  localStorage.setItem('gameArcadeHistory', JSON.stringify(history));
  historyNote.textContent = 'Saved to your history (in this browser for now).';
}
function applyMove(sr, sc, tr, tc) {
  const captured = board[tr][tc];
  board[tr][tc] = board[sr][sc]; board[sr][sc] = '';
  selected = null; legalMoves = [];
  if (captured && captured.toLowerCase() === 'k') {
    const winner = currentPlayer === 'white' ? 'White' : 'Black';
    statusText.textContent = winner + ' wins — king captured!';
    gameActive = false; saveGame(winner + ' wins'); render(); return;
  }
  currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
  statusText.textContent = (currentPlayer === 'white' ? 'White' : 'Black') + "'s turn";
  render();
  if (mode === 'computer' && currentPlayer === 'black' && gameActive) {
    statusText.textContent = "Computer is thinking...";
    setTimeout(() => {
      if (!gameActive) return;
      const m = getComputerMove(); if (!m) return;
      applyMove(m.from[0], m.from[1], m.to[0], m.to[1]);
    }, 600);
  }
}
function onCellClick(r, c) {
  if (!gameActive) return;
  if (mode === 'computer' && currentPlayer === 'black') return;
  const piece = board[r][c];
  const whiteTurn = currentPlayer === 'white';
  if (selected && legalMoves.some(([mr, mc]) => mr === r && mc === c)) {
    applyMove(selected[0], selected[1], r, c); return;
  }
  if (piece && ((whiteTurn && isWhite(piece)) || (!whiteTurn && isBlack(piece)))) {
    selected = [r, c]; legalMoves = getMoves(r, c); render(); return;
  }
  selected = null; legalMoves = []; render();
}
function reset() {
  board = initialBoard(); currentPlayer = 'white';
  selected = null; legalMoves = []; gameActive = true;
  statusText.textContent = "White's turn — click a piece, then a highlighted square";
  historyNote.textContent = ''; render();
}
restartBtn.addEventListener('click', reset);
document.getElementById('mode-friend').addEventListener('click', () => {
  mode = 'friend'; diffPicker.style.display = 'none';
  modeLabel.textContent = 'Mode: Play with a Friend'; reset();
});
document.getElementById('mode-computer').addEventListener('click', () => {
  mode = 'computer'; diffPicker.style.display = 'block';
  modeLabel.textContent = 'Mode: Play with Computer — ' + difficulty; reset();
});
document.querySelectorAll('.difficulty').forEach(btn => {
  btn.addEventListener('click', () => {
    difficulty = btn.dataset.diff;
    document.querySelectorAll('.difficulty').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    modeLabel.textContent = 'Mode: Play with Computer — ' + difficulty; reset();
  });
});
reset();
