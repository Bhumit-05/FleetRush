const { v4: uuidv4 } = require('uuid');
const { createInitialGameState } = require('./gameLogic');
const { activeConnections, broadcastToRoom } = require('../network/roomManager');
const { saveGameSession } = require('../config/redis');

let queue = [];

async function handleJoinQueue(ws) {
  const socketId = ws.socketId;
  if (queue.includes(socketId)) return;

  queue.push(socketId);
  console.log(`Player ${socketId} queued. Queue length: ${queue.length}`);

  if (queue.length >= 2) {
    const p1Id = queue.shift();
    const p2Id = queue.shift();
    const roomId = `room_${uuidv4()}`;

    const p1Socket = activeConnections.get(p1Id);
    const p2Socket = activeConnections.get(p2Id);

    if (p1Socket && p2Socket) {
      p1Socket.roomId = roomId;
      p2Socket.roomId = roomId;

      const initialGameState = createInitialGameState(p1Id, p2Id);
      
      await saveGameSession(roomId, initialGameState);

      broadcastToRoom(roomId, 'MATCH_FOUND', { roomId, opponentId: p2Id }, p1Id);
      broadcastToRoom(roomId, 'MATCH_FOUND', { roomId, opponentId: p1Id }, p2Id);
      console.log(`Match Start in ${roomId} (Saved to Redis)`);
    }
  }
}

function removeFromQueue(socketId) {
  queue = queue.filter(id => id !== socketId);
}

function handleCancelMatchmaking(ws) {
  const socketId = ws.socketId;
  removeFromQueue(socketId);
  console.log(`Player ${socketId} canceled matchmaking. Queue length: ${queue.length}`);
}

module.exports = { handleJoinQueue, removeFromQueue, handleCancelMatchmaking };