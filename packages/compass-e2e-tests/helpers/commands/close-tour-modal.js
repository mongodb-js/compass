const Selectors = require('../selectors');

module.exports = function(app) {
  return async function () {
    const exists = await app.client.waitForElement(Selectors.FeatureTourModal, {
      mustExist: false,
      visibleError: 'Expected feature tour modal to be visible'
    });

    if (!exists) {
      return;
    }

    await app.client.clickVisible(Selectors.CloseFeatureTourModal);

    await app.client.waitUntilGone(Selectors.FeatureTourModal, {
      timeoutMsg: 'Expected feature tour modal to disappear after closing it'
    });
  };
};
