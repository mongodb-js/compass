//const _ = require('lodash');
const debug = require('debug')('compass-e2e-tests').extend('set-ace-value');
const { delay } = require('../delay');

const FOCUS_TAG = 'textarea';
const FOCUS_CLASS = 'ace_text-input';

const META = process.platform === 'darwin' ? 'Meta' : 'Control';

const AUTOCLOSED_CHARS = ['[', '"', "'"];

module.exports = function (app, page, commands) {
  async function focus(selector) {
    // make sure the right element is focused before we continue
    await commands.waitUntil(async () => {
      await page.click(`${selector} .ace_scroller`);

      const focused = await page.$eval(
        `${selector} .ace_text-input`,
        // eslint-disable-next-line no-undef
        (el) => el === document.activeElement
      );

      if (!focused) {
        debug(
          `expected "${FOCUS_TAG}.${FOCUS_CLASS}" to be focused but was not"`
        );
      }

      return focused;
    });
  }
  return async function setAceValue(
    selector,
    value,
    { fightAutocomplete = false } = {}
  ) {
    await focus(selector);

    /*
    await page.evaluate((v) => {
      console.log('writing', v, 'onto the clipboard');
      const electron = require('electron')
      electron.clipboard.writeText(v, 'clipboard');
      console.log('clipboard contains', electron.clipboard.readText('clipboard'));
    }, value);
    */

    await page.keyboard.press(`${META}+A`);
    await page.keyboard.press('Backspace');

    // Unfortunately paste doesn't work in playwright.
    // https://github.com/microsoft/playwright/issues/2511
    // https://github.com/microsoft/playwright/issues/1067
    //await page.keyboard.press(`${META}+V`);

    //console.log({ value });

    if (fightAutocomplete) {
      // ace auto-completes [, " and ' which complicates typing things like JSON
      const steps = [];
      let letters = [];
      const levels = {};
      for (const char of AUTOCLOSED_CHARS) {
        levels[char] = 0;
      }
      for (const char of value) {
        letters.push(char);
        if (AUTOCLOSED_CHARS.includes(char)) {
          steps.push(['type', letters.join(''), { delay: 50 }]);
          letters = [];

          ++levels[char];

          // only backspace when we open a new nesting level
          if (levels[char] % 2 == 0) {
            continue;
          }

          // [ places the cursor to the left of the opening bracket
          // (maybe only the initial one?)
          if (char === '[') {
            steps.push(['press', 'ArrowRight']);
          }

          steps.push(['press', 'ArrowRight']);
          steps.push(['press', 'Backspace']);
        }
      }
      steps.push(['type', letters.join(''), { delay: 50 }]);

      for (const [method, value, options] of steps) {
        //console.log(method, value, options);
        await page.keyboard[method](value, options);
        await delay(50);
      }
    } else {
      await page.keyboard.type(value);
    }
  };
};
