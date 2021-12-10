const Selectors = require('../selectors');

async function setFilter(app, page, commands, tabName, value) {
  await commands.setAceValue(Selectors.queryBarOptionInputFilter(tabName), value);
}

async function setProject(app, page, commands, tabName, value) {
  await commands.setAceValue(
    Selectors.queryBarOptionInputProject(tabName),
    value
  );
}

async function setSort(app, page, commands, tabName, value) {
  await commands.setAceValue(Selectors.queryBarOptionInputSort(tabName), value);
}

async function setCollation(app, page, commands, tabName, value) {
  await commands.setAceValue(
    Selectors.queryBarOptionInputCollation(tabName),
    value
  );
}

async function setMaxTimeMS(app, page, commands, tabName, value) {
  const selector = Selectors.queryBarOptionInputMaxTimeMS(tabName);
  await page.click(selector);
  //await commands.setOrClearValue(selector, value);
  await page.fill(selector, value);
}

async function setSkip(app, page, commands, tabName, value) {
  const selector = Selectors.queryBarOptionInputSkip(tabName);
  await page.click(selector);
  //await commands.setOrClearValue(selector, value);
  await page.fill(selector, value);
}

async function setLimit(app, page, commands, tabName, value) {
  const selector = Selectors.queryBarOptionInputLimit(tabName);
  await page.click(selector);
  //await commands.setOrClearValue(selector, value);
  await page.fill(selector, value);
}

async function runFind(app, page, commands, tabName) {
  await page.click(Selectors.queryBarApplyFilterButton(tabName));
}

async function isOptionsExpanded(app, page, commands, tabName) {
  // it doesn't look like there's some attribute on the options button or
  // container that we can easily check, so just look for a field that exists
  // if it is expanded
  const element = page.locator(Selectors.queryBarOptionInputProject(tabName));
  return await element.isVisible();
}

async function waitUntilCollapsed(app, page, commands, tabName) {
  await page.waitForSelector(Selectors.queryBarOptionInputProject(tabName), {
    state: 'hidden'
  });
}

async function collapseOptions(app, page, commands, tabName) {
  if (!(await isOptionsExpanded(app, page, commands, tabName))) {
    return;
  }

  // Before collapsing the options, clear out all the fields in case they are
  // set. This helps to make the tests idempotent which is handy because you can
  // work on them by focusing one it() at a time and expect it to find the same
  // results as if you ran the whole suite. If we ever do want to test that all
  // the options you had set before you collapsed the options are still in
  // effect then we can make this behaviour opt-out through an option.
  await setProject(app, page, commands, tabName, '');
  await setSort(app, page, commands, tabName, '');
  await setMaxTimeMS(app, page, commands, tabName, '');
  await setCollation(app, page, commands, tabName, '');
  await setSkip(app, page, commands, tabName, '');
  await setLimit(app, page, commands, tabName, '');

  await page.click(Selectors.queryBarOptionsToggle(tabName));
  await waitUntilCollapsed(app, page, commands, tabName);
}

async function waitUntilExpanded(app, page, commands, tabName) {
  await page.waitForSelector(Selectors.queryBarOptionInputProject(tabName));
}

async function expandOptions(app, page, commands, tabName) {
  if (await isOptionsExpanded(app, page, commands, tabName)) {
    return;
  }

  await page.click(Selectors.queryBarOptionsToggle(tabName));
  await waitUntilExpanded(app, page, commands, tabName);
}

module.exports = function (app, page, commands) {
  return async function runFindOperation(
    tabName,
    filter,
    {
      project = '',
      sort = '',
      maxTimeMS = '',
      collation = '',
      skip = '',
      limit = '',
      waitForResult = true,
    } = {}
  ) {
    const queryBarSelector = Selectors.queryBar(tabName);

    // look up the current resultId
    const queryBar = page.locator(queryBarSelector);
    const initialResultId = await queryBar.getAttribute(
      'data-result-id'
    );

    if (project || sort || maxTimeMS || collation || skip || limit) {
      await expandOptions(app, page, commands, tabName);

      await setProject(app, page, commands, tabName, project);
      await setSort(app, page, commands, tabName, sort);
      await setMaxTimeMS(app, page, commands, tabName, maxTimeMS);
      await setCollation(app, page, commands, tabName, collation);
      await setSkip(app, page, commands, tabName, skip);
      await setLimit(app, page, commands, tabName, limit);
    } else {
      await collapseOptions(app, page, commands, tabName);
    }

    await setFilter(app, page, commands, tabName, filter);
    await runFind(app, page, commands, tabName);

    if (waitForResult) {
      // now we can easily see if we get a new resultId
      await commands.waitUntil(async () => {
        const resultId = await queryBar.getAttribute(
          'data-result-id'
        );
        return resultId !== initialResultId;
      });
    }
  };
};
