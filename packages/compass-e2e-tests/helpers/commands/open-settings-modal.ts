import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

export async function openSettingsModal(
  browser: CompassBrowser,
  tab?: string
): Promise<void> {
  await browser.execute(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('electron').ipcRenderer.emit('window:show-settings');
  });

  await browser.waitForOpenModal(Selectors.SettingsModal);
  if (tab) {
    await browser.clickVisible(Selectors.SettingsModalTabSelector(tab));
  }
}
