const debug = require('debug')('compass-e2e-tests').extend('set-ace-value');

const FOCUS_TAG = 'textarea';
const FOCUS_CLASS = 'ace_text-input';

const META = process.platform === 'darwin' ? 'Meta' : 'Control';

module.exports = function (app) {
  return async function setAceValue(selector, value) {
    const { client } = app;

    // make sure the right element is focused before we continue
    await client.waitUntil(async () => {
      await client.clickVisible(`${selector} .ace_scroller`);

      const aceElement = await client.$(`${selector} .ace_text-input`);
      const focused = await aceElement.isFocused();

      if (!focused) {
        debug(
          `expected "${FOCUS_TAG}.${FOCUS_CLASS}" to be focused but was not"`
        );
      }

      return focused;
    });

    await client.keys([META, 'a']);
    await client.keys([META]); // meta a second time to release it
    await client.keys(['Backspace']);
    app.electron.clipboard.writeText(value, 'clipboard');
    await client.keys([META, 'v']);
    await client.keys([META]); // meta a second time to release it
  };
};
