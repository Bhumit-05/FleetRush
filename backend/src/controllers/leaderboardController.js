const db = require('../config/db');

async function updateMatchResults(winnerUsername, loserUsername) {
  const updateWinnerQuery = `
    UPDATE users
    SET wins = wins + 1
    WHERE username = $1;
  `;

  const updateLoserQuery = `
    UPDATE users
    SET losses = losses + 1
    WHERE username = $1;
  `;

  try {
    await db.query('BEGIN');

    await db.query(updateWinnerQuery, [winnerUsername]);
    await db.query(updateLoserQuery, [loserUsername]);

    await db.query('COMMIT');

    console.log(
      `NeonDB Updated: ${winnerUsername} (+1 Win), ${loserUsername} (+1 Loss).`
    );
  } catch (err) {
    await db.query('ROLLBACK');

    console.error('Failed to update match results in NeonDB:', err);
    throw err;
  }
}

module.exports = { updateMatchResults };