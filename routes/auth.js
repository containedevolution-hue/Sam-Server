const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/login — accepts Google id_token, returns JWT + user
router.post('/login', async (req, res) => {
  const { id_token } = req.body || {};
  if (!id_token) return res.status(400).json({ error: 'id_token required' });
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: id_token, audience: process.env.GOOGLE_CLIENT_ID,
    });
    const p = ticket.getPayload();
    if (!p?.email) return res.status(401).json({ error: 'Invalid Google token' });

    // upsert user
    const upsert = await pool.query(
      `INSERT INTO users (google_id, email, name, avatar_url, last_login_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (email) DO UPDATE SET
         google_id = EXCLUDED.google_id,
         name = EXCLUDED.name,
         avatar_url = EXCLUDED.avatar_url,
         last_login_at = NOW()
       RETURNING id, email, name, avatar_url`,
      [p.sub, p.email, p.name || p.email, p.picture || null]
    );
    const user = upsert.rows[0];
    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error('[AUTH] login failed:', err.message);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/me — current user
router.get('/me', requireAuth, (req, res) => res.json(req.user));

module.exports = router;
