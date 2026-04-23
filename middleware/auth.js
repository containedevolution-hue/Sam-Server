const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const SESSION_DAYS = 30;

function signToken(user) {
  return jwt.sign(
    { uid: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: `${SESSION_DAYS}d` }
  );
}

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const r = await pool.query('SELECT id, email, name, avatar_url FROM users WHERE id = $1', [decoded.uid]);
    if (!r.rows.length) return res.status(401).json({ error: 'User not found' });
    req.user = r.rows[0];
    req.userId = r.rows[0].id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth, signToken, JWT_SECRET };
