#!/usr/bin/env node
'use strict';

/** Starts the API, web app and worker together with prefixed output. */
const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const procs = [
  { name: 'api', cmd: 'npm', args: ['run', 'start:dev', '--workspace', 'apps/api'], color: '\x1b[36m' },
  { name: 'web', cmd: 'npm', args: ['run', 'dev', '--workspace', 'apps/web'], color: '\x1b[35m' },
  { name: 'worker', cmd: 'node', args: ['apps/worker/src/index.js'], color: '\x1b[33m' },
];

const children = procs.map(({ name, cmd, args, color }) => {
  const child = spawn(cmd, args, { cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
  const prefix = `${color}[${name}]\x1b[0m `;
  const pipe = (stream, out) =>
    stream.on('data', (chunk) =>
      chunk
        .toString()
        .split('\n')
        .filter(Boolean)
        .forEach((line) => out.write(prefix + line + '\n')),
    );
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => {
    console.log(`${prefix}exited with code ${code}`);
    shutdown(code ?? 0);
  });
  return child;
});

let closing = false;
function shutdown(code) {
  if (closing) return;
  closing = true;
  children.forEach((c) => c.kill('SIGTERM'));
  setTimeout(() => process.exit(code), 500);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
