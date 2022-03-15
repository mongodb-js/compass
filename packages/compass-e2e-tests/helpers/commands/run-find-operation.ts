import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

async function setFilter(
  browser: CompassBrowser,
  tabName: string,
  value: string
) {
  await browser.setAceValue(
    Selectors.queryBarOptionInputFilter(tabName),
    value
  );
}

async function setProject(
  browser: CompassBrowser,
  tabName: string,
  value: string
) {
  await browser.setAceValue(
    Selectors.queryBarOptionInputProject(tabName),
    value
  );
}

async function setSort(
  browser: CompassBrowser,
  tabName: string,
  value: string
) {
  await browser.setAceValue(Selectors.queryBarOptionInputSort(tabName), value);
}

async function setCollation(
  browser: CompassBrowser,
  tabName: string,
  value: string
) {
  await browser.setAceValue(
    Selectors.queryBarOptionInputCollation(tabName),
    value
  );
}

async function setMaxTimeMS(
  browser: CompassBrowser,
  tabName: string,
  value: string
) {
  const selector = Selectors.queryBarOptionInputMaxTimeMS(tabName);
  await browser.clickVisible(selector);
  await browser.setOrClearValue(selector, value);
}

async function setSkip(
  browser: CompassBrowser,
  tabName: string,
  value: string
) {
  const selector = Selectors.queryBarOptionInputSkip(tabName);
  await browser.clickVisible(selector);
  await browser.setOrClearValue(selector, value);
}

async function setLimit(
  browser: CompassBrowser,
  tabName: string,
  value: string
) {
  const selector = Selectors.queryBarOptionInputLimit(tabName);
  await browser.clickVisible(selector);
  await browser.setOrClearValue(selector, value);
}

async function isOptionsExpanded(browser: CompassBrowser, tabName: string) {
  // it doesn't look like there's some attribute on the options button or
  // container that we can easily check, so just look for a field that exists
  // if it is expanded
  const element = await browser.$(
    Selectors.queryBarOptionInputProject(tabName)
  );
  return element.isDisplayed();
}

async function waitUntilCollapsed(browser: CompassBrowser, tabName: string) {
  const queryBarOptionInputProjectElement = await browser.$(
    Selectors.queryBarOptionInputProject(tabName)
  );
  await queryBarOptionInputProjectElement.waitForDisplayed({
    reverse: true,
  });
}

async function maybeResetQuery(browser: CompassBrowser, tabName: string) {
  // click reset if it is enabled to get us back to the empty state
  const resetButton = await browser.$(
    Selectors.queryBarResetFilterButton(tabName)
  );
  await resetButton.waitForDisplayed();

  if (!(await resetButton.getAttribute('class')).includes('disabled')) {
    // look up the current resultId
    const initialResultId = await browser.getQueryId(tabName);

    await resetButton.click();

    // wait for the button to become disabled which should happen once it reset
    // all the filter fields
    await browser.waitUntil(async () => {
      return (await resetButton.getAttribute('class')).includes('disabled');
    });

    // now we can easily see if we get a new resultId
    // (which we should because resetting re-runs the query)
    await browser.waitUntil(async () => {
      const resultId = await browser.getQueryId(tabName);
      return resultId !== initialResultId;
    });
  }
}

async function collapseOptions(browser: CompassBrowser, tabName: string) {
  if (!(await isOptionsExpanded(browser, tabName))) {
    return;
  }

  // Reset the query if there was one before. This helps to make the tests
  // idempotent which is handy because you can work on them by focusing one it()
  // at a time and expect it to find the same results as if you ran the whole
  // suite. If we ever do want to test that all the options you had set before
  // you collapsed the options are still in effect then we can make this
  // behaviour opt-out through an option.
  await maybeResetQuery(browser, tabName);

  await browser.clickVisible(Selectors.queryBarOptionsToggle(tabName));
  await waitUntilCollapsed(browser, tabName);
}

async function waitUntilExpanded(browser: CompassBrowser, tabName: string) {
  const queryBarOptionInputProjectElement = await browser.$(
    Selectors.queryBarOptionInputProject(tabName)
  );
  await queryBarOptionInputProjectElement.waitForDisplayed();
}

async function expandOptions(browser: CompassBrowser, tabName: string) {
  if (await isOptionsExpanded(browser, tabName)) {
    return;
  }

  await browser.clickVisible(Selectors.queryBarOptionsToggle(tabName));
  await waitUntilExpanded(browser, tabName);
}

export async function runFindOperation(
  browser: CompassBrowser,
  tabName: string,
  filter: string,
  {
    project = '',
    sort = '',
    maxTimeMS = '',
    collation = '',
    skip = '',
    limit = '',
    waitForResult = true,
  } = {}
): Promise<void> {
  if (project || sort || maxTimeMS || collation || skip || limit) {
    await expandOptions(browser, tabName);

    await setProject(browser, tabName, project);
    await setSort(browser, tabName, sort);
    await setMaxTimeMS(browser, tabName, maxTimeMS);
    await setCollation(browser, tabName, collation);
    await setSkip(browser, tabName, skip);
    await setLimit(browser, tabName, limit);
  } else {
    await collapseOptions(browser, tabName);
  }

  await setFilter(browser, tabName, filter);

  await browser.runFind(tabName, waitForResult);
  await browser.clickVisible(Selectors.SelectListView);
}
