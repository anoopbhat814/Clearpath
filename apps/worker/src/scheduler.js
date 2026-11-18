'use strict';

/** Tiny interval scheduler with overlap protection and error isolation. */
function createScheduler(log = console) {
  const timers = [];

  function every(name, intervalMs, job) {
    let running = false;
    const tick = async () => {
      if (running) {
        log.warn(`[scheduler] ${name} skipped: previous run still active`);
        return;
      }
      running = true;
      try {
        const result = await job();
        log.log(`[scheduler] ${name} done`, result === undefined ? '' : result);
      } catch (err) {
        log.error(`[scheduler] ${name} failed: ${err.message}`);
      } finally {
        running = false;
      }
    };
    timers.push(setInterval(tick, intervalMs));
    return tick;
  }

  function stop() {
    timers.splice(0).forEach(clearInterval);
  }

  return { every, stop };
}

module.exports = { createScheduler };
