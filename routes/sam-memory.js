const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/sam-memory — list, optional layer filter
router.get('/', async (req, res) => {
  try {
    const vals = [req.userId];
    let where = 'user_id = $1';
    if (req.query.layer) { vals.push(req.query.layer); where += ` AND layer = $${vals.length}`; }
    const r = await pool.query(
      `SELECT * FROM sam_memory WHERE ${where} ORDER BY created_at DESC LIMIT 200`, vals
    );
    res.json(r.rows);
  } catch (err) {
    console.error('[SAM-MEM] list:', err.message);
    res.status(500).json({ error: 'Failed to list memory' });
  }
});

// POST /api/sam-memory — create entry
router.post('/', async (req, res) => {
  const { category, tags, content, source, layer } = req.body || {};
  if (!content) return res.status(400).json({ error: 'content required' });
  try {
    const r = await pool.query(
      `INSERT INTO sam_memory (user_id, category, tags, content, source, layer)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, category || null, tags || [], content, source || 'chat', layer || 'short-term']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('[SAM-MEM] create:', err.message);
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

// PATCH /api/sam-memory/:id — update content/layer/tags
router.patch('/:id', async (req, res) => {
  const { content, layer, tags, category } = req.body || {};
  const fields = [], vals = []; let i = 1;
  if (content !== undefined)  { fields.push(`content = $${i++}`);  vals.push(content); }
  if (layer !== undefined)    { fields.push(`layer = $${i++}`);    vals.push(layer); }
  if (tags !== undefined)     { fields.push(`tags = $${i++}`);     vals.push(tags); }
  if (category !== undefined) { fields.push(`category = $${i++}`); vals.push(category); }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
  vals.push(req.params.id, req.userId);
  try {
    const r = await pool.query(
      `UPDATE sam_memory SET ${fields.join(', ')} WHERE id = $${i} AND user_id = $${i+1} RETURNING *`, vals
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to update' }); }
});

// DELETE /api/sam-memory/:id
router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query(
      'DELETE FROM sam_memory WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete' }); }
});

module.exports = router;
