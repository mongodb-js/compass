const { identifier } = require('jscodeshift');

const debug = require('debug')('compass-e2e-tests').extend('set-ace-value');

const FOCUS_TAG = 'textarea';
const FOCUS_CLASS = 'ace_text-input';

const META = process.platform === 'darwin' ? 'Meta' : 'Control';

async function elementResult(client, elementId) {
  // The API methods that operate off WebElement JSON IDs are all a bit awkward,
  // so just try and get as much debug info as possible.
  return {
    tagName: (await client.elementIdName(elementId)).value,
    className: (await client.elementIdAttribute(elementId, 'class')).value,
    id: (await client.elementIdAttribute(elementId, 'id')).value,
    name: (await client.elementIdAttribute(elementId, 'name')).value,
    dataTestId: (await client.elementIdAttribute(elementId, 'data-test-id'))
      .value,
    text: (await client.elementIdText(elementId)).value,
    value: (await client.elementIdAttribute(elementId, 'value')).value,
  };
}

module.exports = function (app) {
  return async function setAceValue(selector, value) {
    const { client } = app;

    // make sure the right element is focused before we continue
    await client.waitUntil(async () => {
      await client.clickVisible(`${selector} .ace_scroller`);

      const element = await client.elementActive();
      const result = await elementResult(client, element.value.ELEMENT);
      const { tagName, className } = result;
      const focused = tagName === FOCUS_TAG && className === FOCUS_CLASS;

      if (!focused) {
        debug(
          `expected "${FOCUS_TAG}.${FOCUS_CLASS}" to be focused but instead found "${tagName}.${
            className || 'undefined'
          }" with ${JSON.stringify(result)}`
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
