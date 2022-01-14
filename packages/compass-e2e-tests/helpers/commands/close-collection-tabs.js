const Selectors = require('../selectors');

module.exports = function (compass) {
  return async function closeCollectionTabs() {
    const { browser } = compass;

    const closeSelector = Selectors.CloseCollectionTab;

    const countTabs = async () => {
      const closeButtons = await browser.$$(closeSelector);
      return closeButtons.length;
    };

    let numTabs = await countTabs();
    while (numTabs > 0) {
      await browser.waitUntil(async () => {
        // Sometimes for whatever reason clicking to close the tab never closes
        // it so I just moved the click inside the wait loop.
        await browser.clickVisible(closeSelector);

        const tabCount = await countTabs();
        return tabCount < numTabs;
      });

      numTabs = await countTabs();
    }
  };
};
