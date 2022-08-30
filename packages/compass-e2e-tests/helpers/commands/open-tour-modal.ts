import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function openTourModal(browser: CompassBrowser): Promise<void> {
  await browser.execute(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('electron').ipcRenderer.emit('window:show-compass-tour');
  });

  const featureTourModalElement = await browser.$(Selectors.FeatureTourModal);
  await featureTourModalElement.waitForExist();
}
