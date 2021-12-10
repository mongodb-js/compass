module.exports = function (app, page) {
  return async function existsEventually(selector, timeout = 10000) {
    try {
      // return true if it exists before the timeout expires
      const element = page.locator(selector);
      await element.waitFor({
        timeout,
      });
      return true;
    } catch (err) {
      // return false if not
      console.log(`${selector} did not exist after ${timeout}ms`);
      return false;
    }
  };
};
