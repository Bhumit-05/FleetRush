const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();
const { authenticateToken } = require('./middleware/authMiddleware');
const { initWebSocketServer } = require('./network/socketServer');
const { initializeTables } = require('./config/initDb');
const { registerUser, loginUser } = require('./controllers/authController');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);

app.get('/api/user/:username', authenticateToken, async (req, res) => {
  try {
    const result = await require('./config/db').query(
      'SELECT id, username, wins, losses FROM users WHERE username = $1;',
      [req.params.username]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'Engine healthy', timestamp: new Date() });
});

const server = http.createServer(app);
initWebSocketServer(server);

initializeTables().then(() => {
  server.listen(PORT, () => {
    console.log(`Game Core Server running on http://localhost:${PORT}`);
  });
});