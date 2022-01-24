module.exports = function (compass) {
  return async function clickVisible(selector) {
    const { browser } = compass;
    const element = await browser.$(selector);
    await element.waitForDisplayed();
    await browser.waitForAnimations(selector);
    await element.click();
  };
};
