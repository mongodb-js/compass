const Selectors = require('../selectors');

module.exports = function (app) {
  return async function selectStageOperator(index, stageOperator) {
    const { client } = app;

    const inputSelector = Selectors.stageSelectControlInput(index);
    const textareaSelector = Selectors.stageTextarea(index);

    // it should become focused straight after focusStageSelector()
    await client.waitUntil(async () => {
      const isFocused = await client.hasFocus(inputSelector);
      return isFocused === true;
    });

    await client.setValueVisible(inputSelector, stageOperator);
    await client.keys(['Enter']);

    // the "select" should now blur and the ace textarea become focused
    await client.waitUntil(async () => {
      const isFocused = await client.hasFocus(textareaSelector);
      return isFocused === true;
    });
  };
};
