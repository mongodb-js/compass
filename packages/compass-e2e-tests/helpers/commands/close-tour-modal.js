const Selectors = require('../selectors');

module.exports = function (app) {
  return async function () {
    const { client } = app;

    const featureTourModalElement = await client.$(Selectors.FeatureTourModal);

    try {
      await featureTourModalElement.waitForExist({
        timeout: 5000,
      });
    } catch (err) {
      return;
    }

    await featureTourModalElement.waitForDisplayed();
    await client.clickVisible(Selectors.CloseFeatureTourModal);
    await featureTourModalElement.waitForExist({
      timeout: 2000,
      interval: 50,
      reverse: true,
    });
  };
};
