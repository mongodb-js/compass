const debug = require('debug')('compass-e2e-tests').extend('set-ace-value');

const FOCUS_ELEMENT = 'ace_text-input';

const META = process.platform === 'darwin' ? 'Meta' : 'Control';

module.exports = function (app) {
  return async function setAceValue(selector, value) {
    const { client } = app;
    await client.clickVisible(`${selector} .ace_scroller`);

    // make sure the right element is focused before we continue
    await client.waitUntil(async () => {
      const element = await client.elementActive();
      const className = (
        await client.elementIdAttribute(element.value.ELEMENT, 'class')
      ).value;
      if (className !== FOCUS_ELEMENT) {
        debug(
          `expected ${FOCUS_ELEMENT} to be focused but instead found ${className}`
        );
      }
      return className === FOCUS_ELEMENT;
    });

    await client.keys([META, 'a']);
    await client.keys([META]); // meta a second time to release it
    await client.keys(['Backspace']);
    await client.keys(value);
  };
};
