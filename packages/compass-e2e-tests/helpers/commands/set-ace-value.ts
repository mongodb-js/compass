import clipboard from 'clipboardy';
import { expect } from 'chai';
import Debug from 'debug';
import type { CompassBrowser } from '../compass-browser';

const debug = Debug('compass-e2e-tests').extend('set-ace-value');

const FOCUS_TAG = 'textarea';
const FOCUS_CLASS = 'ace_text-input';

export async function setAceValue(
  browser: CompassBrowser,
  selector: string,
  value: string
): Promise<void> {
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

  const META = process.platform === 'darwin' ? 'Meta' : 'Control';

  await browser.keys([META, 'a']);
  await browser.keys([META]); // meta a second time to release it
  await browser.keys(['Backspace']);

  await clipboard.write(value);

  expect(await clipboard.read()).to.equal(value);

  await browser.pause(100);

  // For whatever reason it is shift-insert and not cmd-v  ¯\_(ツ)_/¯
  // https://twitter.com/webdriverio/status/812034986341789696?lang=en
  // https://bugs.chromium.org/p/chromedriver/issues/detail?id=30
  // https://support.google.com/chrome/thread/15776362/is-shift-insert-to-paste-disabled-when-copying-from-outside-of-chrome?hl=en
  if (process.platform === 'darwin') {
    await browser.keys(['Shift', 'Insert']);
    await browser.keys(['Shift']); // shift a second time to release it
  } else {
    await browser.keys(['Control', 'v']);
    await browser.keys(['Control']); // control a second time to release it
  }
}
