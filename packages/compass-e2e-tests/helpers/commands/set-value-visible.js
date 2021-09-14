const { retryWithBackoff } = require('../retry-with-backoff');

module.exports = function (app) {
  return async function setValueVisible(selector, value, timeout = 1000) {
    const { client } = app;
    await client.waitForVisible(selector, timeout);
    // In CI on macOS this can throw "element not interactable". Ideally we'd
    // have a waitForInteractable or similar.
    await retryWithBackoff(async () => {
      await client.setValue(selector, value);
    });
  };
};
