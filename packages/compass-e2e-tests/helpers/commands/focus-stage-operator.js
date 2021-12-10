const Selectors = require('../selectors');

module.exports = function (app, page) {
  return async function focusStageOperator(index) {
    await page.click(Selectors.stageCollapseButton(index));
    await page.click(Selectors.stageExpandButton(index));
    await page.keyboard.press('Tab');
    await page.waitForSelector(Selectors.stageSelectControlInput(index, true));
  };
};
