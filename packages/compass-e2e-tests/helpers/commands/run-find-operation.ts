import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

async function setFilter(
  browser: CompassBrowser,
  tabName: string,
  value: string
) {
  await browser.setCodemirrorEditorValue(
    Selectors.queryBarOptionInputFilter(tabName),
    value
  );
}

async function setProject(
  browser: CompassBrowser,
  tabName: string,
  value: string
) {
  await browser.setCodemirrorEditorValue(
    Selectors.queryBarOptionInputProject(tabName),
    value
  );
}

export async function setSort(
  browser: CompassBrowser,
  tabName: string,
  value: string
) {
  await browser.setCodemirrorEditorValue(
    Selectors.queryBarOptionInputSort(tabName),
    value
  );
}

async function setCollation(
  browser: CompassBrowser,
  tabName: string,
  value: string
) {
  await browser.setCodemirrorEditorValue(
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
  await browser.setValueVisible(selector, value);
}

async function setSkip(
  browser: CompassBrowser,
  tabName: string,
  value: string
) {
  const selector = Selectors.queryBarOptionInputSkip(tabName);
  await browser.clickVisible(selector);
  await browser.setValueVisible(selector, value);
}

export async function setLimit(
  browser: CompassBrowser,
  tabName: string,
  value: string
) {
  const selector = Selectors.queryBarOptionInputLimit(tabName);
  await browser.clickVisible(selector);
  await browser.setValueVisible(selector, value);
}

async function isOptionsExpanded(browser: CompassBrowser, tabName: string) {
  // it doesn't look like there's some attribute on the options button or
  // container that we can easily check, so just look for a field that exists
  // if it is expanded
  const element = browser.$(Selectors.queryBarOptionInputProject(tabName));
  return element.isDisplayed();
}

async function waitUntilCollapsed(browser: CompassBrowser, tabName: string) {
  const queryBarOptionInputProjectElement = browser.$(
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

  await browser.clickVisible(Selectors.queryBarOptionsToggle(tabName));
  await waitUntilCollapsed(browser, tabName);
}

async function waitUntilExpanded(browser: CompassBrowser, tabName: string) {
  const queryBarOptionInputProjectElement = browser.$(
    Selectors.queryBarOptionInputProject(tabName)
  );
  await queryBarOptionInputProjectElement.waitForDisplayed();
}

export async function expandOptions(browser: CompassBrowser, tabName: string) {
  if (await isOptionsExpanded(browser, tabName)) {
    return;
  }

  await browser.clickVisible(Selectors.queryBarOptionsToggle(tabName));
  await waitUntilExpanded(browser, tabName);
}

export type QueryOptions = {
  project?: string;
  sort?: string;
  maxTimeMS?: string;
  collation?: string;
  skip?: string;
  limit?: string;
  expandOptions?: boolean;
};

export async function fillQueryBar(
  browser: CompassBrowser,
  filter = '{}',
  {
    project = '',
    sort = '',
    maxTimeMS = '',
    collation = '',
    skip = '',
    limit = '',
    expandOptions: keepOptionsExpanded = false,
  }: QueryOptions = {},
  tabName = 'Documents'
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

  if (keepOptionsExpanded) {
    await expandOptions(browser, tabName);
  }

  await setFilter(browser, tabName, filter);
}

export async function runFindOperation(
  browser: CompassBrowser,
  tabName: string,
  filter: string,
  {
    // TODO(COMPASS-6606): allow for the same in other tabs with query bar
    waitForResult = true,
    ...queryOptions
  }: { waitForResult?: boolean } & QueryOptions = {}
): Promise<void> {
  await browser.fillQueryBar(filter, queryOptions, tabName);

  await browser.runFind(tabName, waitForResult);

  if (tabName === 'Documents') {
    await browser.clickVisible(Selectors.SelectListView);
  }
}
