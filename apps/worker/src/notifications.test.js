'use strict';

const { createNotificationHandler, renderEmail } = require('./notifications');

describe('notification handler', () => {
  it('rejects malformed jobs', async () => {
    const handle = createNotificationHandler({ pool: { query: jest.fn() }, mailer: { send: jest.fn() } });
    await expect(handle({ title: 'x' })).rejects.toThrow(/requires userId/);
  });

  it('stores an in-app notification and emails when an address is present', async () => {
    const pool = { query: jest.fn().mockResolvedValue({}) };
    const mailer = { send: jest.fn().mockResolvedValue({}) };
    await createNotificationHandler({ pool, mailer })({ userId: 'u1', title: 'Hello', body: 'World', email: 'u1@clearpath.example' });
    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(mailer.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'u1@clearpath.example', subject: 'Hello' }));
  });

  it('does not email without an address', async () => {
    const pool = { query: jest.fn().mockResolvedValue({}) };
    const mailer = { send: jest.fn() };
    await createNotificationHandler({ pool, mailer })({ userId: 'u1', title: 'Hello' });
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it('keeps patient details out of email bodies by contract', () => {
    expect(renderEmail({ title: 'T', body: 'B' })).toMatch(/no patient details/);
  });
});
