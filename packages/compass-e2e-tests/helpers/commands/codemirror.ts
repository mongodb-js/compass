import { Selectors } from '../compass';
import type { CompassBrowser } from '../compass-browser';

export async function getCodemirrorEditorText(
  browser: CompassBrowser,
  selector: string = Selectors.DocumentJSONEntry
) {
  // Codemirror uses virtual rendering, to get full text content of the editor,
  // we have to find an instance of the editor and get the text directly from
  // its state
  const editorContents = await browser.execute(function (selector) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Accessing private Codemirror state
    const node: any =
      // eslint-disable-next-line no-restricted-globals
      document.querySelector(`${selector} [data-codemirror]`) ??
      // eslint-disable-next-line no-restricted-globals
      document.querySelector(`${selector}[data-codemirror]`);
    return node._cm.state.sliceDoc() as string;
  }, selector);
  return editorContents;
}

export async function getCodemirrorEditorTextAll(
  browser: CompassBrowser,
  selector: string = Selectors.DocumentJSONEntry
) {
  // Codemirror uses virtual rendering, to get full text content of the editor,
  // we have to find an instance of the editor and get the text directly from
  // its state
  const editorContents = await browser.execute(function (selector) {
    const editors = Array.from(
      // eslint-disable-next-line no-restricted-globals
      document.querySelectorAll(`${selector} [data-codemirror]`)
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Accessing private Codemirror state
    return editors.map((node: any) => {
      return node._cm.state.sliceDoc() as string;
    });
  }, selector);
  return editorContents;
}

export async function setCodemirrorEditorValue(
  browser: CompassBrowser,
  selector: string,
  text: string
) {
  await browser.execute(
    function (selector, text) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Accessing private Codemirror state
      const node: any =
        // eslint-disable-next-line no-restricted-globals
        document.querySelector(`${selector} [data-codemirror]`) ??
        // eslint-disable-next-line no-restricted-globals
        document.querySelector(`${selector}[data-codemirror]`);
      const editor = node._cm;

      editor.dispatch({
        changes: {
          from: 0,
          to: editor.state.doc.length,
          insert: text,
        },
      });
    },
    selector,
    text
  );
}
