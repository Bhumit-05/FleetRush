function createEmptyBoard() {
  return Array(6).fill(null).map(() => Array(6).fill(0));
}

function createInitialGameState(player1Id, player2Id) {
  return {
    status: 'SETUP',
    winner: null,
    players: {
      [player1Id]: { ready: false, hitsReceived: 0, board: createEmptyBoard() },
      [player2Id]: { ready: false, hitsReceived: 0, board: createEmptyBoard() }
    }
  };
}

function processTorpedoStrike(gameState, defenderId, row, col) {
  const defender = gameState.players[defenderId];
  const currentTileState = defender.board[row][col];

  let result = 'MISS';

  if (currentTileState === 1) { // 1 represents an intact Ship tile
    defender.board[row][col] = 3; // Updating matrix cell to 3 (Hit)
    defender.hitsReceived += 1;
    result = 'HIT';
  } else if (currentTileState === 0) {
    defender.board[row][col] = 2; // Updating matrix cell to 2 (Miss)
    result = 'MISS';
  } else {
    result = 'ALREADY_TARGETED';
  }

  const TOTAL_SHIP_TILES = 6; 
  const isGameOver = defender.hitsReceived === TOTAL_SHIP_TILES;

  return { result, isGameOver };
}

module.exports = {
  createEmptyBoard,
  createInitialGameState,
  processTorpedoStrike
};