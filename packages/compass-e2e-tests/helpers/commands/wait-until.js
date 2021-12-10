const { delay } = require('../delay');

async function retry(f, interval) {
  while (!(await f())) {
    await delay(interval);
  }
}

module.exports = function () {
  return function waitUntil(f, { interval = 50, timeout = 10000 } = {}) {
    const succeedPromise = retry(f, interval);

    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`waitUntil timed out after ${timeout}ms`));
      }, timeout);
    });

    return Promise.race([
      succeedPromise,
      timeoutPromise
    ]);
  };
};
