const boardEl = document.getElementById('board');
const statusText = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const historyNote = document.getElementById('history-note');

const SYMBOLS = { K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙', k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟' };
let board, currentPlayer, selected, legalMoves, gameActive;

function initialBoard() {
  return [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R'],
  ];
}

function isWhite(p) { return p && p === p.toUpperCase(); }
function isBlack(p) { return p && p === p.toLowerCase(); }
function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
function isOpponent(r, c, white) {
  const p = board[r][c];
  return p && (white ? isBlack(p) : isWhite(p));
}

function getMoves(r, c) {
  const piece = board[r][c];
  const white = isWhite(piece);
  const type = piece.toLowerCase();
  const moves = [];
  const add = (nr, nc) => {
    if (!inBounds(nr, nc)) return false;
    if (!board[nr][nc]) { moves.push([nr, nc]); return true; }
    if (isOpponent(nr, nc, white)) { moves.push([nr, nc]); return false; }
    return false;
  };
  const slide = (dirs) => {
    for (const [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc;
      while (inBounds(nr, nc)) {
        if (!add(nr, nc)) break;
        if (board[nr][nc]) break;
        nr += dr; nc += dc;
      }
    }
  };

  if (type === 'p') {
    const dir = white ? -1 : 1;
    const startRow = white ? 6 : 1;
    if (inBounds(r + dir, c) && !board[r + dir][c]) {
      moves.push([r + dir, c]);
      if (r === startRow && !board[r + dir * 2][c]) moves.push([r + dir * 2, c]);
    }
    for (const dc of [-1, 1]) {
      if (inBounds(r + dir, c + dc) && isOpponent(r + dir, c + dc, white)) moves.push([r + dir, c + dc]);
    }
  }
  if (type === 'n') {
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      if (inBounds(r + dr, c + dc) && (!board[r + dr][c + dc] || isOpponent(r + dr, c + dc, white))) moves.push([r + dr, c + dc]);
    }
  }
  if (type === 'r') slide([[-1,0],[1,0],[0,-1],[0,1]]);
  if (type === 'b') slide([[-1,-1],[-1,1],[1,-1],[1,1]]);
  if (type === 'q') slide([[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]);
  if (type === 'k') {
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      if (inBounds(r + dr, c + dc) && (!board[r + dr][c + dc] || isOpponent(r + dr, c + dc, white))) moves.push([r + dr, c + dc]);
    }
  }
  return moves;
}

function render() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = document.createElement('div');
      cell.className = 'chess-cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
      const piece = board[r][c];
      if (piece) {
        cell.textContent = SYMBOLS[piece];
        cell.classList.add(isWhite(piece) ? 'white-piece' : 'black-piece');
      }
      if (selected && selected[0] === r && selected[1] === c) cell.classList.add('selected');
      if (legalMoves.some(([mr, mc]) => mr === r && mc === c)) cell.classList.add('legal');
      cell.addEventListener('click', () => onCellClick(r, c));
      boardEl.appendChild(cell);
    }
  }
}

function saveGame(result) {
  const history = JSON.parse(localStorage.getItem('gameArcadeHistory') || '[]');
  history.push({ game: 'Chess', result, date: new Date().toISOString() });
  localStorage.setItem('gameArcadeHistory', JSON.stringify(history));
  historyNote.textContent = 'Saved to your history (in this browser for now).';
}

function onCellClick(r, c) {
  if (!gameActive) return;
  const piece = board[r][c];
  const whiteTurn = currentPlayer === 'white';

  // Click a legal destination to move
  if (selected && legalMoves.some(([mr, mc]) => mr === r && mc === c)) {
    const [sr, sc] = selected;
    const captured = board[r][c];
    board[r][c] = board[sr][sc];
    board[sr][sc] = '';
    selected = null; legalMoves = [];
    if (captured && captured.toLowerCase() === 'k') {
      const winner = whiteTurn ? 'White' : 'Black';
      statusText.textContent = winner + ' wins — king captured!';
      gameActive = false;
      saveGame(winner + ' wins');
      render();
      return;
    }
    currentPlayer = whiteTurn ? 'black' : 'white';
    statusText.textContent = (whiteTurn ? 'Black' : 'White') + "'s turn — click a piece, then a highlighted square";
    render();
    return;
  }

  // Click your own piece to select it
  if (piece && ((whiteTurn && isWhite(piece)) || (!whiteTurn && isBlack(piece)))) {
    selected = [r, c];
    legalMoves = getMoves(r, c);
    render();
    return;
  }

  selected = null; legalMoves = [];
  render();
}

function reset() {
  board = initialBoard();
  currentPlayer = 'white';
  selected = null; legalMoves = [];
  gameActive = true;
  statusText.textContent = "White's turn — click a piece, then a highlighted square";
  historyNote.textContent = '';
  render();
}

restartBtn.addEventListener('click', reset);
reset();
