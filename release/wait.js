const DEFAULT_DELAY = 5000;
const DEFAULT_MAX_WAIT_TIME = 6 * /* hours */ (1000 * 60 * 60);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function wait(conditionFn, options = {}) {
  options = {
    maxWaitTime: DEFAULT_MAX_WAIT_TIME,
    delay: DEFAULT_DELAY,
    ...options
  };

  if (process.env.MONGODB_COMPASS_RELEASE_MAX_WAIT_TIME) {
    options.maxWaitTime = parseInt(process.env.MONGODB_COMPASS_RELEASE_MAX_WAIT_TIME, 10);
  }

  if (process.env.MONGODB_COMPASS_RELEASE_WAIT_DELAY) {
    options.maxWaitTime = parseInt(process.env.MONGODB_COMPASS_RELEASE_WAIT_DELAY, 10);
  }

  let attempts =
    (
      options.delay === 0 ||
      options.maxWaitTime === 0 ||
      Number.isNaN(options.delay) ||
      Number.isNaN(options.maxWaitTime)
    ) ?
      1 :
      Math.ceil(options.maxWaitTime / options.delay);

  while (attempts--) {
    const conditionResult = await conditionFn();

    if (conditionResult) {
      return conditionResult;
    }

    await delay(options.delay);
  }

  throw new Error('maxWaitTime reached.');
}

module.exports = wait;
