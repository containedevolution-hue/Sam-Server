const express = require('express');
const { requireAuth } = require('../middleware/auth');
const samConfig = require('../lib/sam-config');

const router = express.Router();

// GET /api/identity — returns SOUL + PERSONALITY for Sam's runtime prompt assembly
router.get('/', requireAuth, (req, res) => {
  const c = samConfig.get();
  res.json({
    soul: c.soul,
    personality: c.personality,
    loaded_at: c.loaded_at,
  });
});

module.exports = router;
