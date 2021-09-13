const Selectors = require('../selectors');

module.exports = function (app) {
  return async function () {
    const client = app.wrappedClient;

    if (!(await client.existsEventually(Selectors.FeatureTourModal, 1000))) {
      return;
    }

    await client.waitForVisible(Selectors.FeatureTourModal);
    await client.clickVisible(Selectors.CloseFeatureTourModal);
    await client.waitForExist(Selectors.FeatureTourModal, 1000, false);
  };
};
