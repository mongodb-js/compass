const Selectors = require('../selectors');

module.exports = function (app) {
  return async function () {
    const { client } = app;

    if (!(await client.existsEventually(Selectors.FeatureTourModal))) {
      return;
    }

    const featureTourModalElement = await client.$(Selectors.FeatureTourModal);

    await featureTourModalElement.waitForDisplayed();
    await client.clickVisible(Selectors.CloseFeatureTourModal);
    await featureTourModalElement.waitForExist({
      reverse: true,
    });
  };
};
