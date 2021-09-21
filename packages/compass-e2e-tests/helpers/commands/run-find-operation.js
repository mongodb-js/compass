const Selectors = require('../selectors');

async function setFilter(client, tabSelector, value) {
  await client.setAceValue(
    Selectors.queryBarOptionInputFilter(tabSelector),
    value
  );
}

async function setProject(client, tabSelector, value) {
  await client.setAceValue(
    Selectors.queryBarOptionInputProject(tabSelector),
    value
  );
}

async function setSort(client, tabSelector, value) {
  await client.setAceValue(
    Selectors.queryBarOptionInputSort(tabSelector),
    value
  );
}

async function setCollation(client, tabSelector, value) {
  await client.setAceValue(
    Selectors.queryBarOptionInputCollation(tabSelector),
    value
  );
}

async function setMaxTimeMS(client, tabSelector, value) {
  const selector = Selectors.queryBarOptionInputMaxTimeMS(tabSelector);
  await client.clickVisible(selector);
  await client.setValue(selector, value);
}

async function setSkip(client, tabSelector, value) {
  const selector = Selectors.queryBarOptionInputSkip(tabSelector);
  await client.clickVisible(selector);
  await client.setValue(selector, value);
}

async function setLimit(client, tabSelector, value) {
  const selector = Selectors.queryBarOptionInputLimit(tabSelector);
  await client.clickVisible(selector);
  await client.setValue(selector, value);
}

async function runFind(client, tabSelector) {
  const selector = `${tabSelector} ${Selectors.QueryBarApplyFilterButton}`;
  await client.clickVisible(selector);
  // TODO: maybe there are some generic checks we can perform here to make sure the find is done?
}

async function isOptionsExpanded(client, tabSelector) {
  // it doesn't look like there's some attribute on the options button or container that we can easily check, so just look for a field that exists if it is expanded
  return await client.isVisible(
    `${tabSelector} #query-bar-option-input-project`
  );
}

async function collapseOptions(client, tabSelector) {
  if (!(await isOptionsExpanded(client))) {
    return;
  }

  await client.clickVisible(
    `${tabSelector} [data-test-id="query-bar-options-toggle"]`
  );
  await client.waitUntil(async () => {
    return !(await isOptionsExpanded(client));
  });
}

async function expandOptions(client, tabSelector) {
  if (await isOptionsExpanded(client)) {
    return;
  }

  await client.click(
    `${tabSelector} [data-test-id="query-bar-options-toggle"]`
  );
  await client.waitUntil(async () => {
    return await isOptionsExpanded(client);
  });
}

module.exports = function (app) {
  return async function runFindOperation({
    filter,
    project = '',
    sort = '',
    maxTimeMS = '',
    collation = '',
    skip = '',
    limit = '',
  }) {
    const { client } = app;

    // TODO: support Schema and Explain Plan tabs
    const tabSelector = '[data-test-id="documents-content"]';

    // start by deliberately finding nothing so we can easily check if we found something later
    await collapseOptions(client, tabSelector);
    await setFilter(client, tabSelector, '{ thisDoesNotExist: 1 }');
    await runFind(client, tabSelector);

    // TODO: this only works on the Documents tab
    await client.waitUntil(async () => {
      const text = await client.getText(
        `${tabSelector} .document-list-action-bar-message`
      );
      return text === 'Displaying documents 0 - 0 of N/A';
    });

    // now we can easily see if we get away from the zero state
    await setFilter(client, tabSelector, filter);
    if (project || sort || maxTimeMS || collation || skip || limit) {
      await expandOptions(client, tabSelector);

      await setProject(client, tabSelector, project);
      await setSort(client, tabSelector, sort);
      await setMaxTimeMS(client, tabSelector, maxTimeMS);
      await setCollation(client, tabSelector, collation);
      await setSkip(client, tabSelector, skip);
      await setLimit(client, tabSelector, limit);
    } else {
      await collapseOptions(client, tabSelector);
    }
    await runFind(client, tabSelector);

    // TODO: this only works on the Documents tab
    await client.waitUntil(async () => {
      const text = await client.getText(
        `${tabSelector} .document-list-action-bar-message`
      );
      return text !== 'Displaying documents 0 - 0 of N/A';
    });
  };
};
