module.exports = function (app) {
  return async function existsEventually(selector, timeout) {
    const { client } = app;
    try {
      // return true if it exists before the timeout expires
      // return await client.waitForExist(selector, timeout);
      const element = await client.$(selector);
      return await element.waitForExist({
        timeout,
      });
    } catch (err) {
      // return false if not
      return false;
    }
  };
};
