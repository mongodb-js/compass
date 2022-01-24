module.exports = function (compass) {
  return async function existsEventually(selector, timeout = 10000) {
    const { browser } = compass;
    try {
      // return true if it exists before the timeout expires
      const element = await browser.$(selector);
      return await element.waitForDisplayed({
        timeout,
      });
    } catch (err) {
      // return false if not
      return false;
    }
  };
};
