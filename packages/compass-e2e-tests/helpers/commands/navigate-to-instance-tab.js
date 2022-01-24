const Selectors = require('../selectors');

module.exports = function (compass) {
  return async function navigateToInstanceTab(tabName) {
    const { browser } = compass;

    const tabSelector = Selectors.instanceTab(tabName);
    const tabSelectedSelector = Selectors.instanceTab(tabName, true);

    await browser.clickVisible(Selectors.SidebarTitle);
    const instanceTabElement = await browser.$(Selectors.InstanceTabs);
    await instanceTabElement.waitForDisplayed();

    const tabSelectorElement = await browser.$(tabSelectedSelector);

    // if the correct tab is already visible, do nothing
    if (await tabSelectorElement.isExisting()) {
      return;
    }

    // otherwise select the tab and wait for it to become selected
    await browser.clickVisible(tabSelector);
    await tabSelectorElement.waitForDisplayed();
  };
};
