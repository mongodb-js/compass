const Selectors = require('../selectors');

module.exports = function (app, page) {
  return async function navigateToInstanceTab(tabName) {
    const tabSelector = Selectors.instanceTab(tabName);
    const tabSelectedSelector = Selectors.instanceTab(tabName, true);

    await page.click(Selectors.SidebarTitle);
    await page.waitForSelector(Selectors.InstanceTabs);

    const tab = await page.locator(tabSelectedSelector);

    // if the correct tab is already visible, do nothing
    if (await tab.isVisible()) {
      return;
    }

    // otherwise select the tab and wait for it to become selected
    await page.click(tabSelector);
    await tab.waitFor();
  };
};
