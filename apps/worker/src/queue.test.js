'use strict';

const { backoffMs, processJob } = require('./queue');

function fakeRedis() {
  const lists = {};
  return {
    lists,
    rpush: async (key, value) => {
      (lists[key] = lists[key] || []).push(value);
    },
  };
}

describe('queue', () => {
  const sleep = async () => undefined;

  it('backs off exponentially up to a cap', () => {
    expect(backoffMs(1)).toBe(500);
    expect(backoffMs(3)).toBe(2000);
    expect(backoffMs(20)).toBe(30000);
  });

  it('acknowledges successful jobs', async () => {
    const redis = fakeRedis();
    expect(await processJob(redis, 'notifications', '{"a":1}', async () => undefined, { sleep })).toBe('ok');
    expect(redis.lists).toEqual({});
  });

  it('re-enqueues failures with an attempt counter', async () => {
    const redis = fakeRedis();
    const result = await processJob(redis, 'notifications', '{"a":1}', async () => { throw new Error('smtp down'); }, { sleep });
    expect(result).toBe('retry');
    expect(JSON.parse(redis.lists['queue:notifications'][0])).toMatchObject({ a: 1, attempt: 1, lastError: 'smtp down' });
  });

  it('parks jobs on the dead list after max attempts', async () => {
    const redis = fakeRedis();
    const result = await processJob(redis, 'notifications', '{"attempt":3}', async () => { throw new Error('nope'); }, { maxAttempts: 4, sleep });
    expect(result).toBe('dead');
    expect(redis.lists['queue:notifications:dead']).toHaveLength(1);
  });

  it('dead-letters unparseable payloads immediately', async () => {
    const redis = fakeRedis();
    expect(await processJob(redis, 'notifications', 'not json', async () => undefined, { sleep })).toBe('dead');
  });
});
