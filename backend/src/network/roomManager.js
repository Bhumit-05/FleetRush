const activeConnections = new Map();
const activeGames = new Map();

function sendToClient(ws, type, payload) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

function broadcastToRoom(roomId, type, payload, targetSocketId = null) {
  activeConnections.forEach((ws) => {
    if (ws.roomId === roomId) {
      if (targetSocketId && ws.socketId !== targetSocketId) return;
      sendToClient(ws, type, payload);
    }
  });
}

module.exports = {
  activeConnections,
  activeGames,
  sendToClient,
  broadcastToRoom
};