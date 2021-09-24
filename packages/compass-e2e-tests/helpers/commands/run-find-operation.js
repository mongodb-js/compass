const Selectors = require('../selectors');

async function setFilter(client, tabName, value) {
  await client.setAceValue(Selectors.queryBarOptionInputFilter(tabName), value);
}

async function setProject(client, tabName, value) {
  await client.setAceValue(
    Selectors.queryBarOptionInputProject(tabName),
    value
  );
}

async function setSort(client, tabName, value) {
  await client.setAceValue(Selectors.queryBarOptionInputSort(tabName), value);
}

async function setCollation(client, tabName, value) {
  await client.setAceValue(
    Selectors.queryBarOptionInputCollation(tabName),
    value
  );
}

async function setMaxTimeMS(client, tabName, value) {
  const selector = Selectors.queryBarOptionInputMaxTimeMS(tabName);
  await client.clickVisible(selector);
  await client.setValue(selector, value);
}

async function setSkip(client, tabName, value) {
  const selector = Selectors.queryBarOptionInputSkip(tabName);
  await client.clickVisible(selector);
  await client.setValue(selector, value);
}

async function setLimit(client, tabName, value) {
  const selector = Selectors.queryBarOptionInputLimit(tabName);
  await client.clickVisible(selector);
  await client.setValue(selector, value);
}

async function runFind(client, tabName) {
  await client.clickVisible(Selectors.queryBarApplyFilterButton(tabName));
}

async function isOptionsExpanded(client, tabName) {
  // it doesn't look like there's some attribute on the options button or
  // container that we can easily check, so just look for a field that exists
  // if it is expanded
  return await client.isVisible(Selectors.queryBarOptionInputProject(tabName));
}

async function waitUntilCollapsed(client, tabName) {
  await client.waitForVisible(
    Selectors.queryBarOptionInputProject(tabName),
    1000,
    true
  );
}

async function collapseOptions(client, tabName) {
  if (!(await isOptionsExpanded(client, tabName))) {
    return;
  }

  await client.clickVisible(Selectors.queryBarOptionsToggle(tabName));
  await waitUntilCollapsed(client, tabName);
}

async function waitUntilExpanded(client, tabName) {
  await client.waitForVisible(Selectors.queryBarOptionInputProject(tabName));
}

async function expandOptions(client, tabName) {
  if (await isOptionsExpanded(client, tabName)) {
    return;
  }

  await client.clickVisible(Selectors.queryBarOptionsToggle(tabName));
  await waitUntilExpanded(client, tabName);
}

module.exports = function (app) {
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
    } = {}
  ) {
    const { client } = app;

    const queryBarSelector = Selectors.queryBar(tabName);

    // look up the current resultId
    const initialResultId = await client.getAttribute(
      queryBarSelector,
      'data-result-id'
    );

    // now we can easily see if we get a new resultId
    await setFilter(client, tabName, filter);
    if (project || sort || maxTimeMS || collation || skip || limit) {
      await expandOptions(client, tabName);

      await setProject(client, tabName, project);
      await setSort(client, tabName, sort);
      await setMaxTimeMS(client, tabName, maxTimeMS);
      await setCollation(client, tabName, collation);
      await setSkip(client, tabName, skip);
      await setLimit(client, tabName, limit);
    } else {
      await collapseOptions(client, tabName);
    }
    await runFind(client, tabName);

    await client.waitUntil(async () => {
      const resultId = await client.getAttribute(
        queryBarSelector,
        'data-result-id'
      );
      return resultId !== initialResultId;
    });
  };
};
