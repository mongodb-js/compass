const Selectors = require('../selectors');

module.exports = function (app) {
  return async function focusStageOperator(index) {
    const { client } = app;

    await client.clickVisible(Selectors.stageCollapseButton(index));
    await client.clickVisible(Selectors.stageExpandButton(index));
    await client.keys(['Tab']);
    await client.waitForVisible(Selectors.stageSelectControlInput(index, true));
  };
};
