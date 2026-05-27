import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

const STAGE_OPTION_TESTID_PREFIX = 'combobox-option-stage-';

export async function getStageOperators(
  browser: CompassBrowser,
  index: number
) {
  await browser.focusStageOperator(index);
  const testids = await browser
    .$$(Selectors.stageOperatorOptions(index))
    .map((element) => element.getAttribute('data-testid'));

  const actualOptions = testids
    .filter(
      (testid): testid is string =>
        testid !== null && testid.startsWith(STAGE_OPTION_TESTID_PREFIX)
    )
    .map((testid) => testid.slice(STAGE_OPTION_TESTID_PREFIX.length));
  actualOptions.sort();

  // Unfocus the stage select operator.
  await browser.$(Selectors.StageCardAtIndex(index)).click();

  return actualOptions;
}
