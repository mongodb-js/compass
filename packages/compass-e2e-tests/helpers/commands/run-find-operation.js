const Selectors = require('../selectors');

async function setFilter(client, value) {
  await client.setAceValue('[data-test-id="documents-content"] #query-bar-option-input-filter', value);
}

async function setProject(client, value) {
  await client.setAceValue('[data-test-id="documents-content"] #query-bar-option-input-project', value);
}

async function setSort(client, value) {
  await client.setAceValue('[data-test-id="documents-content"] #query-bar-option-input-sort', value);
}

async function setCollation(client, value) {
  await client.setAceValue('[data-test-id="documents-content"] #query-bar-option-input-collation', value);
}

async function setMaxTimeMS(client, value) {
  const selector = '[data-test-id="documents-content"] [id="querybar-option-input-Max Time MS"]';
  await client.clickVisible(selector);
  await client.setValue(selector, value);
}

async function setSkip(client, value) {
  const selector = '[data-test-id="documents-content"] #querybar-option-input-skip';
  await client.clickVisible(selector);
  await client.setValue(selector, value);
}

async function setLimit(client, value) {
  const selector = '[data-test-id="documents-content"] #querybar-option-input-limit';
  await client.clickVisible(selector);
  await client.setValue(selector, value);
}

async function runFind(client) {
  await client.clickVisible(Selectors.QueryBarApplyFilterButton);
  // TODO: maybe there are some generic checks we can perform here to make sure the find is done?
}

async function isOptionsExpanded(client, ) {
  // it doesn't look like there's some attribute on the options button or container that we can easily check, so just look for a field that exists if it is expanded
  return await client.isVisible('[data-test-id="documents-content"] #query-bar-option-input-project');
}

async function collapseOptions(client) {
  if (!(await isOptionsExpanded(client))) {
    return;
  }

  await client.clickVisible('[data-test-id="documents-content"] [data-test-id="query-bar-options-toggle"]');
  await client.waitUntil(async () => {
    return !(await isOptionsExpanded(client));
  });
}

async function expandOptions(client) {
  if (await isOptionsExpanded(client)) {
    return;
  }

  await client.click('[data-test-id="documents-content"] [data-test-id="query-bar-options-toggle"]');
  await client.waitUntil(async () => {
    return await isOptionsExpanded(client);
  });
}

module.exports = function (app) {
  return async function runFindOperation({ filter, project = '', sort = '', maxTimeMS = '', collation = '', skip = '', limit = ''}) {
    const { client } = app;

    // TODO: support Schema and Explain Plan tabs
    const tabSelector = '[data-test-id="documents-content"]';

    // start by deliberately finding nothing so we can easily check if we found something later
    await collapseOptions(client);
    await setFilter(client, '{ thisDoesNotExist: 1 }');
    await runFind(client);

    // TODO: this only works on the Documents tab
    await client.waitUntil(async () => {
      const text = await client.getText(`${tabSelector} .document-list-action-bar-message`);
      return text === 'Displaying documents 0 - 0 of N/A';
    });

    // now we can easily see if we get away from the zero state
    await setFilter(client, filter);
    if (project || sort || maxTimeMS || collation || skip || limit) {
      await expandOptions(client);

      await setProject(client, project);
      await setSort(client, sort);
      await setMaxTimeMS(client, maxTimeMS);
      await setCollation(client, collation);
      await setSkip(client, skip);
      await setLimit(client, limit);
    } else {
      await collapseOptions(client);
    }
    await runFind(client);

    // TODO: this only works on the Documents tab
    await client.waitUntil(async () => {
      const text = await client.getText(`${tabSelector} .document-list-action-bar-message`);
      return text !== 'Displaying documents 0 - 0 of N/A';
    });
  };
};
