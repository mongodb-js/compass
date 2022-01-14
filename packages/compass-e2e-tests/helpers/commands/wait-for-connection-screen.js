const Selectors = require('../selectors');

module.exports = function (compass) {
  return async function waitForConnectionScreen() {
    const { browser } = compass;
    const connectScreenElement = await browser.$(Selectors.ConnectSection);
    await connectScreenElement.waitForDisplayed();
  };
};
