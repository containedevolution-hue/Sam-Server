const { Pool } = require('pg');
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: isProduction ? { rejectUnauthorized: false } : false }
    : {
        host:     process.env.PGHOST,
        port:     parseInt(process.env.PGPORT || '5432'),
        database: process.env.PGDATABASE,
        user:     process.env.PGUSER,
        password: process.env.PGPASSWORD,
        ssl:      isProduction ? { rejectUnauthorized: false } : false
      }
);
module.exports = pool;
