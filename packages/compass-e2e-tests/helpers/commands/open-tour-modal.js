const Selectors = require('../selectors');

const MINUTE = 60_000;

module.exports = function (app) {
  return async function () {
    const { client } = app;

    await client.execute(() => {
      const menu = require('electron').remote.Menu.getApplicationMenu();
      let subMenu;
      for (let i = 0; i < menu.getItemCount(); i++) {
        if (menu.getLabelAt(i) === '&Help') {
          subMenu = menu.items[i].submenu;
          break;
        }
      }
      if (!subMenu) {
        throw new Error('Could not find Help submenu');
      }
      for (let i = 0; i < subMenu.getItemCount(); i++) {
        if (subMenu.getLabelAt(i).endsWith('Overview')) {
          subMenu.items[i].click();
          return;
        }
      }
      throw new Error('Could not find overview item to click');
    });

    const featureTourModalElement = await client.$(Selectors.FeatureTourModal);
    await featureTourModalElement.waitForExist({ timeout: MINUTE });
  };
};
