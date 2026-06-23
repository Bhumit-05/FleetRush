const db = require('./db');

async function initializeTables() {
  const createUserTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      wins INT DEFAULT 0,
      losses INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await db.query(createUserTableQuery);
    console.log('PostgreSQL Tables checked/created successfully in NeonDB.');
  } catch (err) {
    console.error('Failed to initialize database tables:', err);
    process.exit(1);
  }
}

module.exports = { initializeTables };