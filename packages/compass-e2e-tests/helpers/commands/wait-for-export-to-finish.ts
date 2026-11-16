import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

export async function waitForExportToFinishAndCloseToast(
  browser: CompassBrowser
) {
  // Wait for the export to finish and close the toast.
  const toastElement = browser.$(Selectors.ExportToast);
  await toastElement.waitForDisplayed();

  await browser.waitUntil(async () => {
    return (await toastElement.getText()).includes('Export completed.');
  });
  await browser
    .$(Selectors.closeToastButton(Selectors.ExportToast))
    .waitForDisplayed();
  await browser.clickVisible(Selectors.closeToastButton(Selectors.ExportToast));
  await toastElement.waitForDisplayed({ reverse: true });
}
