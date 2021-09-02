module.exports = function (app) {
  return async function clickVisible(selector, timeout = 1000) {
    // waitForVisible gives better errors than interacting with a non-existing
    // element
    await app.client.waitForVisible(selector, timeout);
    await app.client.click(selector);
  };
};
