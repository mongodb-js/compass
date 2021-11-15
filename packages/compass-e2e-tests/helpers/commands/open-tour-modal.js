const Selectors = require('../selectors');

const MINUTE = 60_000;

module.exports = function (app) {
  return async function () {
    const { client } = app;

    await client.execute(() => {
      require('electron').ipcRenderer.emit('window:show-compass-tour');
    });

    const featureTourModalElement = await client.$(Selectors.FeatureTourModal);
    await featureTourModalElement.waitForExist({ timeout: MINUTE });
  };
};
