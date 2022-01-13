const Selectors = require('../selectors');

module.exports = function (compass) {
  return async function focusStageOperator(index) {
    const { browser } = compass;

    await browser.clickVisible(Selectors.stageCollapseButton(index));
    await browser.clickVisible(Selectors.stageExpandButton(index));
    await browser.keys(['Tab']);
    const stageSelectorElement = await browser.$(
      Selectors.stageSelectControlInput(index, true)
    );
    await stageSelectorElement.waitForDisplayed();
  };
};
