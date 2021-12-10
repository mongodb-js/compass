const _ = require('lodash');
const debug = require('debug')('compass-e2e-tests').extend('set-ace-value');
const { delay } = require('../delay');

const FOCUS_TAG = 'textarea';
const FOCUS_CLASS = 'ace_text-input';

const META = process.platform === 'darwin' ? 'Meta' : 'Control';

module.exports = function (app, page, commands) {
  return async function setAceValue(selector, value) {

    // make sure the right element is focused before we continue
    await commands.waitUntil(async () => {
      await page.click(`${selector} .ace_scroller`);

      // TODO: command
      // eslint-disable-next-line no-undef
      const focused = await page.$eval(`${selector} .ace_text-input`, (el) => el === document.activeElement);

      if (!focused) {
        debug(
          `expected "${FOCUS_TAG}.${FOCUS_CLASS}" to be focused but was not"`
        );
      }

      return focused;
    });

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
    //await page.keyboard.press(`${META}+V`);

    // This gets messed up by long lines and confused by things like
    // auto-indent, auto-complete and so on.
    await page.keyboard.type(value);
  };
};
