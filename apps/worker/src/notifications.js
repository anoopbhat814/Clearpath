'use strict';

const { randomUUID } = require('crypto');

/** Renders the plain-text email body for a notification job. */
function renderEmail(job) {
  const lines = [job.title, '', job.body || '', '', 'Sign in to Clearpath to review. This message contains no patient details.'];
  return lines.join('\n');
}

/**
 * Handles a `notifications` job: { userId, kind, title, body?, email? }.
 * The in-app notification is always written; email is sent only when an address is supplied.
 */
function createNotificationHandler({ pool, mailer }) {
  return async function handle(job) {
    if (!job.userId || !job.title) throw new Error('notification job requires userId and title');
    await pool.query(
      'INSERT INTO notifications (id, "userId", kind, title, body) VALUES ($1, $2, $3, $4, $5)',
      [randomUUID(), job.userId, job.kind || 'general', job.title, job.body || null],
    );
    if (job.email) {
      await mailer.send({ to: job.email, subject: job.title, text: renderEmail(job) });
    }
  };
}

module.exports = { createNotificationHandler, renderEmail };
