const Selectors = require('../selectors');

module.exports = function (app) {
  return async function closeCollectionTabs() {
    const { client } = app;

    const closeSelector = Selectors.CloseCollectionTab;

    const countTabs = async () => {
      return (await client.$$(closeSelector)).length;
    };

    let numTabs = await countTabs();
    while (numTabs > 0) {
      await client.clickVisible(closeSelector);

      await client.waitUntil(async () => {
        return (await countTabs()) < numTabs;
      });

      numTabs = await countTabs();
    }
  };
};
