import clipboard from 'clipboardy';
import Debug from 'debug';
import type { Browser } from 'webdriverio';
import * as Commands from '../commands';

const debug = Debug('compass-e2e-tests').extend('set-ace-value');

const FOCUS_TAG = 'textarea';
const FOCUS_CLASS = 'ace_text-input';

export async function setAceValue(
  browser: Browser<'async'>,
  selector: string,
  value: string
): Promise<void> {
  // make sure the right element is focused before we continue
  await browser.waitUntil(async () => {
    await Commands.clickVisible(browser, `${selector} .ace_scroller`);

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

  // For whatever reason it is shift-insert and not cmd-v  ¯\_(ツ)_/¯
  // https://twitter.com/webdriverio/status/812034986341789696?lang=en
  // https://bugs.chromium.org/p/chromedriver/issues/detail?id=30
  await browser.keys(['Shift', 'Insert']);
  await browser.keys(['Shift']); // shift a second time to release it
}
