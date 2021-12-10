const Selectors = require('../selectors');

const MINUTE = 60_000;

module.exports = function (app, page) {
  return async function () {
    await page.evaluate(() => {
      require('electron').ipcRenderer.emit('window:show-compass-tour');
    });

    await page.waitForSelector(Selectors.FeatureTourModal, { timeout: MINUTE });
  };
};
