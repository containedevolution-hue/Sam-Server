const express = require('express');
const pool = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login — accepts Google access_token, returns JWT + user
router.post('/login', async (req, res) => {
  const { access_token } = req.body || {};
  if (!access_token) return res.status(400).json({ error: 'access_token required' });
  try {
    // Verify token with Google tokeninfo
    const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${access_token}`);
    const info = await r.json();
    if (info.error || !info.email) return res.status(401).json({ error: 'Invalid token', detail: info.error || 'no email' });

    // Fetch user profile
    const pr = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const profile = await pr.json();

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
      [info.sub, info.email, profile.name || info.email, profile.picture || null]
    );
    const user = upsert.rows[0];
    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error('[AUTH] login failed:', err.message);
    res.status(401).json({ error: 'Authentication failed', detail: err.message });
  }
});

// GET /api/auth/me — current user
router.get('/me', requireAuth, (req, res) => res.json(req.user));

module.exports = router;
