module.exports = function (app) {
  return async function existsEventually(selector, timeout) {
    const { client } = app;
    try {
      // return true if it exists before the timeout expires
      const element = await client.$(selector);
      return await element.waitForDisplayed({
        timeout,
      });
    } catch (err) {
      // return false if not
      return false;
    }
  };
};
