import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function dropDatabase(
  browser: CompassBrowser,
  dbName: string
): Promise<void> {
  const dropModalElement = await browser.$(Selectors.DropDatabaseModal);
  await dropModalElement.waitForDisplayed();

  const confirmInput = await browser.$(Selectors.DropDatabaseConfirmName);
  await confirmInput.setValue(dbName);

  const confirmButton = await browser.$(Selectors.DropDatabaseDropButton);
  await confirmButton.waitForEnabled();

  await browser.screenshot('drop-database-modal.png');

  await confirmButton.click();

  await dropModalElement.waitForDisplayed({ reverse: true });
}
