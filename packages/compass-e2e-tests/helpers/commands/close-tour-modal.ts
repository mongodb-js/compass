import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function closeTourModal(browser: CompassBrowser): Promise<void> {
  if (!(await browser.existsEventually(Selectors.FeatureTourModal))) {
    return;
  }

  const featureTourModalElement = await browser.$(Selectors.FeatureTourModal);

  await featureTourModalElement.waitForDisplayed();
  await browser.clickVisible(Selectors.CloseFeatureTourModal);
  await featureTourModalElement.waitForExist({
    reverse: true,
  });
}
