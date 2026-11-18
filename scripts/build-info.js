#!/usr/bin/env node
'use strict';

/** Writes build-info.json (version, commit, timestamp) consumed by deployment tooling. */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
let commit = process.env.GITHUB_SHA || 'unknown';
try {
  if (commit === 'unknown') commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
} catch {
  /* not a git checkout */
}

const info = { name: pkg.name, version: pkg.version, commit, builtAt: new Date().toISOString() };
fs.writeFileSync(path.join(__dirname, '..', 'build-info.json'), JSON.stringify(info, null, 2) + '\n');
console.log('wrote build-info.json', info);
