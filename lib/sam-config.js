// Loads Sam's Config files (SOUL, PERSONALITY) from disk at boot.
// These are the identity layer that every conversation reads.
const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, '..', 'Config');
let cache = { soul: '', personality: '', loaded_at: null };

function load() {
  try {
    const soulPath = path.join(CONFIG_DIR, 'SOUL.md');
    const persPath = path.join(CONFIG_DIR, 'PERSONALITY.md');
    cache.soul = fs.existsSync(soulPath) ? fs.readFileSync(soulPath, 'utf8') : '';
    cache.personality = fs.existsSync(persPath) ? fs.readFileSync(persPath, 'utf8') : '';
    cache.loaded_at = new Date().toISOString();
    console.log(`[SAM-CONFIG] loaded — SOUL ${cache.soul.length}b, PERSONALITY ${cache.personality.length}b`);
  } catch (err) {
    console.error('[SAM-CONFIG] load failed:', err.message);
  }
}

function get() { return { ...cache }; }

module.exports = { load, get };
