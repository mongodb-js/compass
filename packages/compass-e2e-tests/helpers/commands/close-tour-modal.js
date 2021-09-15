const Selectors = require('../selectors');

module.exports = function (app) {
  return async function () {
    const { client } = app;

    if (!(await client.existsEventually(Selectors.FeatureTourModal, 5000))) {
      return;
    }

    await client.waitForVisible(Selectors.FeatureTourModal);
    await client.clickVisible(Selectors.CloseFeatureTourModal);
    await client.waitForExist(Selectors.FeatureTourModal, 5000, false);
  };
};
