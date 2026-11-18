#!/usr/bin/env node
'use strict';

/** Sanity checks on prisma/migrations: naming, ordering, lock file and non-empty SQL. */
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..', 'prisma', 'migrations');
const errors = [];

if (!fs.existsSync(path.join(dir, 'migration_lock.toml'))) errors.push('migration_lock.toml is missing');

const folders = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
const pattern = /^\d{14}_[a-z0-9_]+$/;
for (const name of folders) {
  if (!pattern.test(name)) errors.push(`bad migration folder name: ${name}`);
  const sql = path.join(dir, name, 'migration.sql');
  if (!fs.existsSync(sql) || fs.statSync(sql).size === 0) errors.push(`${name}/migration.sql is missing or empty`);
}
const sorted = [...folders].sort();
if (JSON.stringify(sorted) !== JSON.stringify(folders)) errors.push('migrations are not in chronological order on disk');

if (errors.length) {
  errors.forEach((e) => console.error(e));
  process.exit(1);
}
console.log(`${folders.length} migrations verified`);
