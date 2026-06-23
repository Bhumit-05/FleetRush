const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

async function registerUser(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertQuery = `
      INSERT INTO users (username, password_hash) 
      VALUES ($1, $2) 
      RETURNING id, username, wins, losses;
    `;
    
    const result = await db.query(insertQuery, [username, passwordHash]);
    const newUser = result.rows[0];

    const token = generateToken(newUser);

    return res.status(201).json({ 
      message: 'User registered successfully', 
      token,
      user: { id: newUser.id, username: newUser.username, wins: newUser.wins, losses: newUser.losses } 
    });
    
  } catch (err) {
    if (err.code === '23505') { 
      return res.status(400).json({ error: 'Username already exists' });
    }
    console.error('Registration Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function loginUser(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const findUserQuery = `SELECT * FROM users WHERE username = $1;`;
    const result = await db.query(findUserQuery, [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user);

    return res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, wins: user.wins, losses: user.losses }
    });

  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { registerUser, loginUser };