'use strict';

const { Pool } = require('pg');

function createPool(connectionString) {
  const pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 30_000 });
  pool.on('error', (err) => console.error('[db] idle client error', err.message));
  return pool;
}

module.exports = { createPool };
