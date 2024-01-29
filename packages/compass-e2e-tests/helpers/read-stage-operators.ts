import type { CompassBrowser } from '../helpers/compass-browser';
import * as Selectors from '../helpers/selectors';

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
