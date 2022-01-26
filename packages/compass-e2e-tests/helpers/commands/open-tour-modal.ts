import type { Browser } from 'webdriverio';
import * as Selectors from '../selectors';

const MINUTE = 60_000;

export async function openTourModal(browser: Browser<'async'>): Promise<void> {
  await browser.execute(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('electron').ipcRenderer.emit('window:show-compass-tour');
  });

  const featureTourModalElement = await browser.$(Selectors.FeatureTourModal);
  await featureTourModalElement.waitForExist({ timeout: MINUTE });
}
