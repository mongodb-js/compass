import type { Browser } from 'webdriverio';
import * as Commands from '../commands';
import * as Selectors from '../selectors';

export async function closeTourModal(browser: Browser<'async'>): Promise<void> {
  if (!(await Commands.existsEventually(browser, Selectors.FeatureTourModal))) {
    return;
  }

  const featureTourModalElement = await browser.$(Selectors.FeatureTourModal);

  await featureTourModalElement.waitForDisplayed();
  await Commands.clickVisible(browser, Selectors.CloseFeatureTourModal);
  await featureTourModalElement.waitForExist({
    reverse: true,
  });
}
