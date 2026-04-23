// Sam Server — Personal AI assistant backend
// Mirrors ce-team architecture: Express + Postgres + boot-time migrations + Config cache
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const pool = require('./db');
const runMigrations = require('./db/migrate');
const samConfig = require('./lib/sam-config');

const authRoutes = require('./routes/auth');
const samMemoryRoutes = require('./routes/sam-memory');
const identityRoutes = require('./routes/identity');
const appDataRoutes = require('./routes/app-data');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '12mb' }));

app.get('/config.js', (req, res) => {
  res.type('application/javascript');
  res.send(`window.SAM_GOOGLE_CLIENT_ID = "${process.env.GOOGLE_CLIENT_ID || ''}";`);
});

app.use('/api/auth', authRoutes);
app.use('/api/sam-memory', samMemoryRoutes);
app.use('/api/identity', identityRoutes);
app.use('/api/app-data', appDataRoutes);

app.get('/health', (req, res) => {
  const c = samConfig.get();
  res.json({
    status: 'ok',
    service: 'sam-server',
    version: '0.1.0',
    soul_loaded: !!c.soul,
    personality_loaded: !!c.personality,
    config_loaded_at: c.loaded_at,
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Boot sequence: run migrations, load Config, then listen
(async () => {
  try {
    await runMigrations();
    samConfig.load();
  } catch (err) {
    console.error('[BOOT] error during startup tasks:', err.message);
  }
  app.listen(PORT, () => {
    console.log(`[SAM-SERVER] v0.1.0 listening on port ${PORT}`);
    console.log(`[SAM-SERVER] env: ${process.env.NODE_ENV || 'development'}`);
  });
})();
