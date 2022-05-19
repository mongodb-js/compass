import chai, { expect } from 'chai';
import { promises as fs } from 'fs';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

export async function setExportFilename(
  browser: CompassBrowser,
  filename: string
): Promise<void> {
  // make sure the file doesn't already exist
  await expect(fs.stat(filename)).to.be.rejected;

  await browser.execute(function (f) {
    document.dispatchEvent(
      new CustomEvent('selectExportFileName', { detail: f })
    );
  }, filename);

  await browser.waitUntil(async () => {
    const exportModalFileText = await browser.$(Selectors.ExportModalFileText);
    const value = await exportModalFileText.getValue();
    return value === filename;
  });
}
