const Selectors = require('../selectors');

module.exports = function (compass) {
  return async function closeCollectionTabs() {
    const { browser } = compass;

    const closeSelector = Selectors.CloseCollectionTab;

    const countTabs = async () => {
      return (await browser.$$(closeSelector)).length;
    };

    let numTabs = await countTabs();
    while (numTabs > 0) {
      await browser.clickVisible(closeSelector);

      await browser.waitUntil(async () => {
        return (await countTabs()) < numTabs;
      });

      numTabs = await countTabs();
    }
  };
};
