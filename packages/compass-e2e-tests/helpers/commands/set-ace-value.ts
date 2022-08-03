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

  const editorValue = await browser.execute(
    (_selector, _value) => {
      const editorNode =
        document.querySelector(`${_selector} .ace_editor`) ||
        document.querySelector(`${_selector}.ace_editor`);
      if (!editorNode) {
        throw new Error(
          `Cannot find ace-editor container for selector ${_selector}`
        );
      }
      const editor = (window as any).ace.edit(editorNode.id);
      editor.setValue(_value);
      return editor.getValue();
    },
    selector,
    value
  );
  expect(editorValue).to.equal(value);
  await browser.pause(100);
}
