#!/usr/bin/env node
'use strict';

/** Verifies .env (or the process environment) against the variables Clearpath needs. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const example = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
const expected = example
  .split('\n')
  .filter((l) => l.trim() && !l.startsWith('#'))
  .map((l) => l.split('=')[0]);

const envFile = path.join(root, '.env');
const fromFile = {};
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) fromFile[m[1]] = m[2];
  }
}

const required = ['DATABASE_URL', 'REDIS_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const get = (k) => process.env[k] ?? fromFile[k];
let failed = false;

for (const key of required) {
  if (!get(key)) {
    console.error(`missing required variable ${key}`);
    failed = true;
  }
}
for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
  const v = get(key);
  if (v && (v.length < 32 || v.startsWith('change-me'))) {
    console.error(`${key} is too short or still uses the example value`);
    failed = process.env.NODE_ENV === 'production' || failed;
  }
}
const optionalMissing = expected.filter((k) => !required.includes(k) && !get(k));
if (optionalMissing.length) console.warn(`optional variables not set (defaults apply): ${optionalMissing.join(', ')}`);

if (failed) process.exit(1);
console.log('environment looks good');
