import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

const STAGE_OPTION_TESTID_PREFIX = 'combobox-option-stage-';

export async function getStageOperators(
  browser: CompassBrowser,
  index: number
) {
  await browser.focusStageOperator(index);

  const options = await browser
    .$$(`[data-testid^="${STAGE_OPTION_TESTID_PREFIX}"]`)
    .map((el) => el.getAttribute('data-testid'));

  const actualOptions = (options.filter(Boolean) as string[]).map((id) =>
    id.slice(STAGE_OPTION_TESTID_PREFIX.length)
  );

  actualOptions.sort();

  // Unfocus the stage select operator.
  await browser.$(Selectors.StageCardAtIndex(index)).click();

  return actualOptions;
}
