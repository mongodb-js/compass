import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

export async function addWizard(
  browser: CompassBrowser,
  usecaseId: string,
  index: number
): Promise<void> {
  await browser.toggleAggregationSidePanel('opened');
  await browser.clickVisible(Selectors.AggregationWizardUseCase(usecaseId));

  const wizardCard = browser.$(Selectors.AggregationWizardCardAtIndex(index));
  await wizardCard.waitForDisplayed();
}
