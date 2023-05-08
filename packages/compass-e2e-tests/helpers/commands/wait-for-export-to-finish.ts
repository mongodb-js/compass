import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function waitForExportToFinishAndCloseToast(
  browser: CompassBrowser
) {
  // Wait for the export to finish and close the toast.
  const toastElement = await browser.$(Selectors.ExportToast);
  await toastElement.waitForDisplayed();

  const exportShowFileButtonElement = await browser.$(
    Selectors.ExportToastShowFile
  );
  await exportShowFileButtonElement.waitForDisplayed();
  await browser
    .$(Selectors.closeToastButton(Selectors.ExportToast))
    .waitForDisplayed();
  await browser.clickVisible(Selectors.closeToastButton(Selectors.ExportToast));
  await toastElement.waitForDisplayed({ reverse: true });
}
