module.exports = function (app) {
  return async function waitUntilGone(
    selector,
    { timeout = 5000, interval = 200, timeoutMsg } = {}
  ) {
    return app.client.waitUntil(
      async () => !(await app.client.isExisting(selector)),
      {
        timeout,
        interval,
        timeoutMsg,
      }
    );
  };
};
