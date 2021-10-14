const Selectors = require('../selectors');

module.exports = function (app) {
  return async function () {
    const { client } = app;

    const featureTourModalElement = await client.$(Selectors.FeatureTourModal);
    try {
      await featureTourModalElement.waitForExist();
    } catch (err) {
      return;
    }

    await featureTourModalElement.waitForDisplayed();
    await client.clickVisible(Selectors.CloseFeatureTourModal);

    await featureTourModalElement.waitForExist({
      reverse: true,
    });
  };
};
