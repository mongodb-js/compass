const { delay } = require('../delay');

module.exports = function(app) {
  return async function waitForElement(selector, {
      timeout = 5000,
      interval = 200,
      mustExist = true,
      mustBeVisible = true,
      mustNotTransition = true,
      returnElement = false,
      existError,
      visibleError
    } = {}
  ) {

    const getResult = async (exists) => {
      if (returnElement) {
        return exists ? app.client.$(selector) : null;
      }

      return exists ? true : false;
    };

    const existOpts = { timeout, interval, timeoutMsg: existError };
    try {
      await app.client.waitUntil(
        async () => app.client.isExisting(selector), existOpts);
    } catch (err) {
      if (mustExist) {
        throw err;
      }
      return null;
    }

    if (!mustBeVisible) {
      return getResult(true);
    }

    const visibleOpts = { timeout, interval, timeoutMsg: visibleError };
    await app.client.waitUntil(
      async () => app.client.isVisible(selector), visibleOpts);

    if (mustNotTransition) {
      // Ideally we could check if various properties of the element aren't
      // changing between two intervals, but this should be good enough for
      // now.
      await delay(200);
    }

    return getResult(true);
  };
};
