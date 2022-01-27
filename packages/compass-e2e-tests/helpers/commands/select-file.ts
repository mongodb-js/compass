import type { CompassBrowser } from '../compass-browser';

export async function selectFile(
  browser: CompassBrowser,
  fileSelector: string,
  filePath: string
): Promise<void> {
  // HACK: the <input type="file"> is not displayed so we can't interact
  // with it until we change that.
  await browser.execute((selector) => {
    // eslint-disable-next-line no-undef
    const f = document.querySelector(selector);
    if (f) {
      f.removeAttribute('style');
    }
  }, fileSelector);

  // select the file
  const fileInput = await browser.$(fileSelector);
  await fileInput.setValue(filePath);

  // HACK: undo what we just did
  await browser.execute((selector) => {
    // eslint-disable-next-line no-undef
    const f = document.querySelector(selector);
    if (f) {
      f.setAttribute('style', 'display: none');
    }
  }, fileSelector);
}
