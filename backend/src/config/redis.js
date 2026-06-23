const { Redis } = require('@upstash/redis');
const redis = Redis.fromEnv();

async function saveGameSession(roomId, gameState) {
  try {
    await redis.set(roomId, JSON.stringify(gameState), { ex: 3600 });
  } catch (err) {
    console.error('Redis Set Error:', err);
  }
}

async function getGameSession(roomId) {
  try {
    const data = await redis.get(roomId);
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (err) {
    console.error('Redis Get Error:', err);
    return null;
  }
}

async function deleteGameSession(roomId) {
  try {
    await redis.del(roomId);
  } catch (err) {
    console.error('Redis Delete Error:', err);
  }
}

module.exports = {
  saveGameSession,
  getGameSession,
  deleteGameSession
};