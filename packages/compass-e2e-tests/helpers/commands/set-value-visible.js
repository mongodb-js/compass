module.exports = function (compass) {
  return async function setValueVisible(selector, value) {
    const { browser } = compass;
    const element = await browser.$(selector);
    await element.waitForDisplayed();
    await element.setValue(value);
  };
};
