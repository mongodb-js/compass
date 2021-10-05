const Selectors = require('../selectors');

module.exports = function (app) {
  return async function navigateToInstanceTab(tabName) {
    const { client } = app;

    const tabSelector = Selectors.instanceTab(tabName);
    const tabSelectedSelector = Selectors.instanceTab(tabName, true);

    await client.clickVisible(Selectors.SidebarTitle);
    const instanceTabElement = await client.$(Selectors.InstanceTabs);
    await instanceTabElement.waitForDisplayed();

    const tabSelectorElement = await client.$(tabSelectedSelector);

    // if the correct tab is already visible, do nothing
    if (await tabSelectorElement.isExisting()) {
      return;
    }

    // otherwise select the tab and wait for it to become selected
    await client.clickVisible(tabSelector);
    await tabSelectorElement.waitForDisplayed();
  };
};
