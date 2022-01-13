const debug = require('debug')('compass-e2e-tests').extend('set-ace-value');

const FOCUS_TAG = 'textarea';
const FOCUS_CLASS = 'ace_text-input';

const META = process.platform === 'darwin' ? 'Meta' : 'Control';

module.exports = function (compass) {
  return async function setAceValue(selector, value) {
    const { browser } = compass;

    // make sure the right element is focused before we continue
    await browser.waitUntil(async () => {
      await browser.clickVisible(`${selector} .ace_scroller`);

      const aceElement = await browser.$(`${selector} .ace_text-input`);
      const focused = await aceElement.isFocused();

      if (!focused) {
        debug(
          `expected "${FOCUS_TAG}.${FOCUS_CLASS}" to be focused but was not"`
        );
      }

      return focused;
    });

    await browser.keys([META, 'a']);
    await browser.keys([META]); // meta a second time to release it
    await browser.keys(['Backspace']);
    compass.electron.clipboard.writeText(value, 'clipboard');
    await browser.keys([META, 'v']);
    await browser.keys([META]); // meta a second time to release it
  };
};
