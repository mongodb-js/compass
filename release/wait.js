const delay = require('delay');

const DEFAULT_DELAY = 5000;
const DEFAULT_MAX_WAIT_TIME = 6 * /* hours */ (1000 * 60 * 60);

async function wait(conditionFn, options = {}) {
  options = {
    maxWaitTime: DEFAULT_MAX_WAIT_TIME,
    delay: DEFAULT_DELAY,
    ...options
  };

  let attempts = Math.round(options.maxWaitTime / options.delay);

  while (attempts--) {
    const conditionResult = await conditionFn();

    if (conditionResult) {
      return conditionResult;
    }

    await delay(5000);
  }

  throw new Error('maxWaitTime reached.');
}

module.exports = wait;
