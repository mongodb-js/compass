const Selectors = require('../selectors');

module.exports = function (compass) {
  return async function () {
    const { browser } = compass;

    if (!(await browser.existsEventually(Selectors.FeatureTourModal))) {
      return;
    }

    const featureTourModalElement = await browser.$(Selectors.FeatureTourModal);

    await featureTourModalElement.waitForDisplayed();
    await browser.clickVisible(Selectors.CloseFeatureTourModal);
    await featureTourModalElement.waitForExist({
      reverse: true,
    });
  };
};
