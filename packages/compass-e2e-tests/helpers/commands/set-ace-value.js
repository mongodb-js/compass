const debug = require('debug')('compass-e2e-tests').extend('set-ace-value');

const FOCUS_TAG = 'textarea';
const FOCUS_CLASS = 'ace_text-input';

const META = process.platform === 'darwin' ? 'Meta' : 'Control';

async function elementResult(client, elementId) {
  // The API methods that operate off WebElement JSON IDs are all a bit awkward,
  // so just try and get as much debug info as possible.

  // TODO: Maybe needs # at start
  const element = await client.$(elementId);
  return {
    tagName: await element.getAttribute('name'),
    className: await element.getAttribute('class'),
    id: await element.getAttribute('id'),
    name: await element.getAttribute('name'),
    dataTestId: await element.getAttribute('data-test-id'),
    text: await element.getText(),
    value: await element.getValue(),
  };
}

module.exports = function (app) {
  return async function setAceValue(selector, value) {
    const { client } = app;

    // make sure the right element is focused before we continue
    await client.waitUntil(async () => {
      await client.clickVisible(`${selector} .ace_scroller`);

      const aceElement = await client.$(`${selector} .ace_scroller`);
      const focused = await aceElement.isFocused();

      if (!focused) {
        debug(
          `expected "${FOCUS_TAG}.${FOCUS_CLASS}" to be focused but was not;"`
        );
      }

      return focused;
    });

    await client.keys([META, 'a']);
    await client.keys([META]); // meta a second time to release it
    await client.keys(['Backspace']);
    await client.keys(value);
  };
};
