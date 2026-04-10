import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

export async function getStageOperators(
  browser: CompassBrowser,
  index: number
) {
  await browser.focusStageOperator(index);
  const options = await browser
    .$$(Selectors.stageOperatorOptions(index))
    .map((element) => element.getText());

  const actualOptions = options.map((option) => option.split('\n')[0]);
  actualOptions.sort();

  return actualOptions;
}
