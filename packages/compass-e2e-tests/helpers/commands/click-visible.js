module.exports = function (app) {
  return async function clickVisible(selector, timeout = 1000) {
    // waitForVisible gives better errors than interacting with a non-existing
    // element
    const client = app.wrappedClient;
    await client.waitForVisible(selector, timeout);
    await client.click(selector);
  };
};
