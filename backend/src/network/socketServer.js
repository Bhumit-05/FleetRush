// src/network/socketServer.js
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const { activeConnections, sendToClient, broadcastToRoom } = require('./roomManager');
const { handleJoinQueue, removeFromQueue } = require('../game/matchmaker');
const { processTorpedoStrike } = require('../game/gameLogic');
const { updateMatchResults } = require('../controllers/leaderboardController');
const { getGameSession, saveGameSession, deleteGameSession } = require('../config/redis'); // Added Redis methods

function initWebSocketServer(server) {
  const wss = new WebSocketServer({ server });
  console.log('⚡ Raw WebSocket Engine attached');

  wss.on('connection', (ws) => {
    const socketId = uuidv4();
    ws.socketId = socketId;
    ws.roomId = null;
    ws.username = null;
    activeConnections.set(socketId, ws);

    sendToClient(ws, 'CONNECTED', { socketId });

    ws.on('message', async (rawData) => {
      try {
        const { type, payload } = JSON.parse(rawData);
        const roomId = ws.roomId;
        
        let game = roomId ? await getGameSession(roomId) : null;

        switch (type) {
          case 'JOIN_QUEUE':
            ws.username = payload.username || 'Anonymous'; 
            handleJoinQueue(ws);
            break;
          
          case 'LEAVE_QUEUE':
            const { handleCancelMatchmaking } = require('../game/matchmaker');
            handleCancelMatchmaking(ws);
            break;
            
          case 'SUBMIT_BOARD':
            if (!game || game.status !== 'SETUP') return;
            
            game.players[socketId].board = payload.board;
            game.players[socketId].ready = true;

            const opponentId = Object.keys(game.players).find(id => id !== socketId);
            
            if (game.players[opponentId] && game.players[opponentId].ready) {
              game.status = 'PLAYING';
              
              await saveGameSession(roomId, game);
              broadcastToRoom(roomId, 'GAME_START', { status: 'PLAYING' });
              console.log(`Battle commenced in Room: ${roomId} (State synced to Redis)`);
            } else {
              await saveGameSession(roomId, game);
              sendToClient(ws, 'WAITING_FOR_OPPONENT', { msg: 'Your board is locked in. Waiting on enemy.' });
            }
            break;

          case 'FIRE_TORPEDO':
            if (!game || game.status !== 'PLAYING') return;

            const targetRow = payload.row;
            const targetCol = payload.col;
            const defenderPlayerId = Object.keys(game.players).find(id => id !== socketId);

            const strike = processTorpedoStrike(game, defenderPlayerId, targetRow, targetCol);

            if (strike.result === 'ALREADY_TARGETED') {
              sendToClient(ws, 'INVALID_MOVE', { error: 'You already shot at this coordinate!' });
              return;
            }

            broadcastToRoom(roomId, 'TORPEDO_LANDED', {
              attackerId: socketId,
              defenderId: defenderPlayerId,
              row: targetRow,
              col: targetCol,
              result: strike.result
            });

            if (strike.isGameOver) {
              game.status = 'FINISHED';
              game.winner = socketId;
              
              broadcastToRoom(roomId, 'GAME_OVER', { winnerId: socketId });
              console.log(`🏆 Match Finished! Winner: ${socketId}`);

              const winnerSocket = activeConnections.get(socketId);
              const loserSocket = activeConnections.get(defenderPlayerId);

              if (winnerSocket && loserSocket) {
                updateMatchResults(winnerSocket.username, loserSocket.username);
              }

              await deleteGameSession(roomId);
            } else {
              await saveGameSession(roomId, game);
            }
            break;

          default:
            console.log(`Unknown event: ${type}`);
        }
      } catch (err) {
        console.error('Invalid message format received:', err);
      }
    });

    ws.on('close', async () => {
      activeConnections.delete(socketId);
      removeFromQueue(socketId);
      
      if (ws.roomId) {
        const game = await getGameSession(ws.roomId);
        if (game) {
          broadcastToRoom(ws.roomId, 'OPPONENT_DISCONNECTED', { msg: 'Opponent left.' });
          await deleteGameSession(ws.roomId);
        }
      }
      console.log(`Disconnected: ${socketId}`);
    });
  });
}

module.exports = { initWebSocketServer };