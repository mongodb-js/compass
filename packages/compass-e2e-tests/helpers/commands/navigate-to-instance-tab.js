const Selectors = require('../selectors');

module.exports = function (app) {
  return async function navigateToInstanceTab(tabName) {
    const { client } = app;

    const tabSelector = Selectors.instanceTab(tabName);
    const tabSelectedSelector = Selectors.instanceTab(tabName, true);

    await client.click(Selectors.SidebarTitle);
    await client.waitForVisible(Selectors.InstanceTabs);

    // if the correct tab is already visible, do nothing
    if (await client.isExisting(tabSelectedSelector)) {
      return;
    }

    // otherwise select the tab and wait for it to become selected
    await client.click(tabSelector);
    await client.waitForVisible(tabSelectedSelector);
  };
};
