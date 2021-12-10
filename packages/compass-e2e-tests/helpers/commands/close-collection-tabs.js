const Selectors = require('../selectors');

module.exports = function (app, page, commands) {
  return async function closeCollectionTabs() {
    const closeSelector = Selectors.CloseCollectionTab;

    const countTabs = async () => {
      return (await page.$$(closeSelector)).length;
    };

    let numTabs = await countTabs();
    while (numTabs > 0) {
      await page.click(closeSelector);

      await commands.waitUntil(async () => {
        return (await countTabs()) < numTabs;
      });

      numTabs = await countTabs();
    }
  };
};
