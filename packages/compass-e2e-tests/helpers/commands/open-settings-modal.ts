import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function openSettingsModal(
  browser: CompassBrowser
): Promise<void> {
  await browser.execute(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('electron').ipcRenderer.emit('window:show-network-optin');
  });

  const settingsModalElement = await browser.$(Selectors.SettingsModal);
  await settingsModalElement.waitForExist();
}
