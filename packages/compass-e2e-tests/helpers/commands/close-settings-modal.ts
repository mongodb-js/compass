import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function closeSettingsModal(
  browser: CompassBrowser
): Promise<void> {
  if (!(await browser.isModalEventuallyOpen(Selectors.SettingsModal))) {
    return;
  }

  await browser.waitForOpenModal(Selectors.SettingsModal);
  await browser.clickVisible(Selectors.CloseSettingsModalButton);
  await browser.waitForOpenModal(Selectors.SettingsModal, { reverse: true });
}
