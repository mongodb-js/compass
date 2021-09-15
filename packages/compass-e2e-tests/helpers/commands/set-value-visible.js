const { retryWithBackoff } = require('../retry-with-backoff');

module.exports = function (app) {
  return async function setValueVisible(selector, value) {
    const { client } = app;
    await client.waitForVisible(selector);
    // In CI on macOS this can throw "element not interactable". Ideally we'd
    // have a waitForInteractable or similar.
    await retryWithBackoff(
      async () => {
        await client.setValue(selector, value);
      },
      3,
      1000
    );
  };
};
