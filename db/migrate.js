// Run all SQL migrations in order. Safe to re-run — all use IF NOT EXISTS.
const fs = require('fs');
const path = require('path');
const pool = require('./index');

async function migrate() {
  const dir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(dir)) { console.log('[MIGRATE] no migrations dir'); return; }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    try { await pool.query(sql); console.log(`[MIGRATE] ${f} ok`); }
    catch (err) { console.error(`[MIGRATE] ${f} failed:`, err.message); }
  }
}

if (require.main === module) { migrate().then(() => process.exit(0)); }
module.exports = migrate;
