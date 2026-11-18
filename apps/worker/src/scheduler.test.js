'use strict';

const { createScheduler } = require('./scheduler');

describe('scheduler', () => {
  const quiet = { log: () => undefined, warn: jest.fn(), error: jest.fn() };

  it('skips a run while the previous one is still active', async () => {
    const scheduler = createScheduler(quiet);
    let release;
    const job = jest.fn(() => new Promise((r) => (release = r)));
    const tick = scheduler.every('slow', 1_000_000, job);
    const first = tick();
    await tick();
    expect(job).toHaveBeenCalledTimes(1);
    expect(quiet.warn).toHaveBeenCalled();
    release();
    await first;
    scheduler.stop();
  });

  it('isolates job failures', async () => {
    const scheduler = createScheduler(quiet);
    const tick = scheduler.every('bad', 1_000_000, async () => { throw new Error('boom'); });
    await expect(tick()).resolves.toBeUndefined();
    expect(quiet.error).toHaveBeenCalledWith(expect.stringContaining('boom'));
    scheduler.stop();
  });
});
