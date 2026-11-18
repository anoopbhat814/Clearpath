'use strict';

/**
 * Reliable-ish list consumer: BLPOP a job, run the handler, and on failure re-enqueue
 * with an incremented attempt counter. After `maxAttempts` the job is parked on a dead list.
 */
function backoffMs(attempt, base = 500, cap = 30_000) {
  return Math.min(cap, base * 2 ** (attempt - 1));
}

async function processJob(redis, queue, raw, handler, { maxAttempts = 4, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  let job;
  try {
    job = JSON.parse(raw);
  } catch {
    await redis.rpush(`queue:${queue}:dead`, raw);
    return 'dead';
  }
  const attempt = (job.attempt || 0) + 1;
  try {
    await handler(job);
    return 'ok';
  } catch (err) {
    const next = { ...job, attempt, lastError: String(err && err.message ? err.message : err) };
    if (attempt >= maxAttempts) {
      await redis.rpush(`queue:${queue}:dead`, JSON.stringify(next));
      return 'dead';
    }
    await sleep(backoffMs(attempt));
    await redis.rpush(`queue:${queue}`, JSON.stringify(next));
    return 'retry';
  }
}

async function consume(redis, queue, handler, opts = {}) {
  const signal = opts.signal;
  while (!signal || !signal.aborted) {
    const popped = await redis.blpop(`queue:${queue}`, 2);
    if (!popped) continue;
    await processJob(redis, queue, popped[1], handler, opts);
  }
}

module.exports = { backoffMs, processJob, consume };
