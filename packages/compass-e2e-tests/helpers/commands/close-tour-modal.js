const Selectors = require('../selectors');

module.exports = function (app) {
  return async function () {
    const { client } = app;

    if (!(await client.existsEventually(Selectors.FeatureTourModal))) {
      return;
    }

    await client.waitForVisible(Selectors.FeatureTourModal);
    await client.clickVisible(Selectors.CloseFeatureTourModal);
    await client.waitForVisible(Selectors.FeatureTourModal, undefined, true);
  };
};
