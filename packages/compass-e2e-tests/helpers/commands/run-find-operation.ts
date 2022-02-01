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

async function runFind(browser: CompassBrowser, tabName: string) {
  await browser.clickVisible(Selectors.queryBarApplyFilterButton(tabName));
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

async function collapseOptions(browser: CompassBrowser, tabName: string) {
  if (!(await isOptionsExpanded(browser, tabName))) {
    return;
  }

  // Before collapsing the options, clear out all the fields in case they are
  // set. This helps to make the tests idempotent which is handy because you can
  // work on them by focusing one it() at a time and expect it to find the same
  // results as if you ran the whole suite. If we ever do want to test that all
  // the options you had set before you collapsed the options are still in
  // effect then we can make this behaviour opt-out through an option.
  await setProject(browser, tabName, '');
  await setSort(browser, tabName, '');
  await setMaxTimeMS(browser, tabName, '');
  await setCollation(browser, tabName, '');
  await setSkip(browser, tabName, '');
  await setLimit(browser, tabName, '');

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
  const queryBarSelector = Selectors.queryBar(tabName);

  // look up the current resultId
  const queryBarSelectorElement = await browser.$(queryBarSelector);
  const initialResultId = await queryBarSelectorElement.getAttribute(
    'data-result-id'
  );

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
  await runFind(browser, tabName);

  if (waitForResult) {
    // now we can easily see if we get a new resultId
    await browser.waitUntil(async () => {
      const resultId = await queryBarSelectorElement.getAttribute(
        'data-result-id'
      );
      return resultId !== initialResultId;
    });
  }
}
