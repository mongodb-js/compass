const { TestBackend } = require('storage-mixin');
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import AppRegistry from 'hadron-app-registry';

import { configureStore } from '../stores/query-history-store';
import { comparableQuery } from './comparable-query';
import { addRecent } from '../modules/recent-queries';

describe('comparableQuery', function () {
  let tmpDir;
  let store;
  let appRegistry;

  beforeEach(async function () {
    tmpDir = await fs.promises.mkdir(
      path.join(os.tmpdir(), 'comparable-query-storage-tests')
    );
    TestBackend.enable(tmpDir);
    appRegistry = new AppRegistry();
    store = configureStore({ localAppRegistry: appRegistry, namespace: 'foo' });
  });

  afterEach(function () {
    TestBackend.disable();
    fs.rmdirSync(tmpDir, { recursive: true });
  });

  it('strips ampersand properties', function () {
    const recent = { filter: { foo: 1 } };

    store.dispatch(addRecent(recent));
    const state = store.getState();
    expect(state.recentQueries.items.length).to.equal(1);

    const query = state.recentQueries.items.at(0);

    // make sure it has the things we're going to strip
    const serialized = query.serialize();
    expect(serialized).to.haveOwnProperty('_id');
    expect(serialized).to.haveOwnProperty('_lastExecuted');
    expect(serialized).to.haveOwnProperty('_ns');

    expect(comparableQuery(query)).to.deep.equal({
      filter: { foo: 1 },
    });
  });
});
