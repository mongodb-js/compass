const Selectors = require('../selectors');

module.exports = function (app, page, commands) {
  return async function selectStageOperator(index, stageOperator) {
    const inputSelector = Selectors.stageSelectControlInput(index);
    const textareaSelector = Selectors.stageTextarea(index);

    // it should become focused straight after focusStageSelector()
    await commands.waitUntil(async () => {
      // eslint-disable-next-line no-undef
      // TODO: command
      const isFocused = await page.$eval(
        inputSelector,
        (el) => el === document.activeElement
      );
      return isFocused === true;
    });

    await page.fill(inputSelector, stageOperator);
    await page.keyboard.press('Enter');

    // the "select" should now blur and the ace textarea become focused
    await commands.waitUntil(async () => {
      // eslint-disable-next-line no-undef
      // TODO: command
      const isFocused = await page.$eval(
        textareaSelector,
        (el) => el === document.activeElement
      );
      return isFocused === true;
    });
  };
};
