const Selectors = require('../selectors');

module.exports = function (app) {
  return async function () {
    if (!await app.client.existsEventually(Selectors.FeatureTourModal, 1000)) {
      return;
    }

    await app.client.waitForVisible(Selectors.FeatureTourModal);
    await app.client.clickVisible(Selectors.CloseFeatureTourModal);
    await app.client.waitForExist(Selectors.FeatureTourModal, 1000, false);
  };
};
