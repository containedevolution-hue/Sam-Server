const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/app-data/:appName — return all keys for this app as { key: value }
router.get('/:appName', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT key, value FROM app_data WHERE user_id = $1 AND app_name = $2',
      [req.userId, req.params.appName]
    );
    const out = {};
    r.rows.forEach(row => {
      try { out[row.key] = JSON.parse(row.value); } catch { out[row.key] = row.value; }
    });
    res.json(out);
  } catch (err) {
    console.error('[APP-DATA] get:', err.message);
    res.status(500).json({ error: 'Failed to get app data' });
  }
});

// PUT /api/app-data/:appName — upsert a blob of { key: value } pairs
router.put('/:appName', async (req, res) => {
  const blob = req.body || {};
  const keys = Object.keys(blob);
  if (!keys.length) return res.status(400).json({ error: 'No data provided' });
  try {
    for (const key of keys) {
      const value = JSON.stringify(blob[key]);
      await pool.query(
        `INSERT INTO app_data (user_id, app_name, key, value, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id, app_name, key)
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [req.userId, req.params.appName, key, value]
      );
    }
    res.json({ ok: true, keys: keys.length });
  } catch (err) {
    console.error('[APP-DATA] put:', err.message);
    res.status(500).json({ error: 'Failed to save app data' });
  }
});

module.exports = router;
