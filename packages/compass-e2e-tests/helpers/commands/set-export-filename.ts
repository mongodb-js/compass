import chai, { expect } from 'chai';
import { promises as fs } from 'fs';
import type { CompassBrowser } from '../compass-browser.ts';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

/**
 * When calling this function, it sets the export filename within `export-modal.tsx`
 * and also triggers the export process. This is a workaround to avoid the triggering
 * of native file picker dialog:
 * - Which can not be accessed by wdio and prevents picking the file
 * - Which blocks DOM interaction and prevents clicking the abort toast
 * button (COMPASS-10717, on darwin).
 */
export async function setExportFilename(
  browser: CompassBrowser,
  filename: string
): Promise<void> {
  // make sure the file doesn't already exist
  await expect(fs.stat(filename)).to.be.rejected;

  await browser.execute(function (f) {
    // eslint-disable-next-line no-restricted-globals
    document.dispatchEvent(
      new CustomEvent('selectExportFileName', { detail: f })
    );
  }, filename);
}
