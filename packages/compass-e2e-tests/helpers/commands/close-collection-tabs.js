module.exports = function (app) {
  return async function closeCollectionTabs() {
    const { client } = app;

    const closeSelector = '[data-test-id="close-collection-tab"]';

    const countTabs = async () => {
      return (await client.$$(closeSelector)).length;
    };

    let numTabs = await countTabs();
    while (numTabs > 0) {
      await client.click(closeSelector);

      await client.waitUntil(async () => {
        return (await countTabs()) < numTabs;
      });

      numTabs = await countTabs();
    }
  };
};
