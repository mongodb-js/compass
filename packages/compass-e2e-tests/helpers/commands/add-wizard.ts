import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function addWizard(
  browser: CompassBrowser,
  usecaseId: string,
  index: number
): Promise<void> {
  await browser.toggleAggregationSidePanel('opened');
  await browser.clickVisible(Selectors.AggregationWizardUseCase(usecaseId));

  const wizardCard = await browser.$(
    Selectors.AggregationWizardCardAtIndex(index)
  );
  await wizardCard.waitForDisplayed();
}
