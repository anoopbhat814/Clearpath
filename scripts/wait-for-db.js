#!/usr/bin/env node
'use strict';

/** Blocks until PostgreSQL accepts TCP connections; used by container entrypoints and CI. */
const net = require('net');

const url = new URL(process.env.DATABASE_URL || 'postgresql://clearpath:clearpath@localhost:5432/clearpath');
const host = url.hostname;
const port = Number(url.port || 5432);
const timeoutMs = Number(process.env.WAIT_TIMEOUT_MS || 60_000);
const started = Date.now();

function attempt() {
  const socket = net.connect({ host, port });
  socket.once('connect', () => {
    socket.destroy();
    console.log(`database reachable at ${host}:${port}`);
    process.exit(0);
  });
  socket.once('error', () => {
    socket.destroy();
    if (Date.now() - started > timeoutMs) {
      console.error(`timed out waiting for ${host}:${port}`);
      process.exit(1);
    }
    setTimeout(attempt, 1000);
  });
}

attempt();
