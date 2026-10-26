import type { CompassBrowser } from '../compass-browser.ts';

/**
 * Dispatches the `selectExportFileName` DOM event that `export-modal.tsx`
 * listens to and which starts the export. This is a workaround to avoid the
 * native save file picker:
 * - which can not be accessed by wdio and prevents picking the file
 * - which blocks DOM interaction and prevents clicking the abort toast
 * button (COMPASS-10717, on darwin).
 *
 * The export is written to a file with this name in the origin private file
 * system. Use `readExportedFile` to read it back.
 */
export async function setExportFilename(
  browser: CompassBrowser,
  filename: string
): Promise<void> {
  await browser.execute(function (f) {
    // eslint-disable-next-line no-restricted-globals
    document.dispatchEvent(
      new CustomEvent('selectExportFileName', { detail: f })
    );
  }, filename);
}

export async function readExportedFile(
  browser: CompassBrowser,
  filename: string
): Promise<string> {
  return await browser.execute(async function (f) {
    const directory = await navigator.storage.getDirectory();
    const fileHandle = await directory.getFileHandle(f);
    return await (await fileHandle.getFile()).text();
  }, filename);
}
