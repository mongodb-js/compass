const Selectors = require('../selectors');

const MINUTE = 60_000;

module.exports = function (compass) {
  return async function () {
    const { browser } = compass;

    await browser.execute(() => {
      require('electron').ipcRenderer.emit('window:show-compass-tour');
    });

    const featureTourModalElement = await browser.$(Selectors.FeatureTourModal);
    await featureTourModalElement.waitForExist({ timeout: MINUTE });
  };
};
