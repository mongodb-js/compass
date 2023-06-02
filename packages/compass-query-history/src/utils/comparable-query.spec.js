const { TestBackend } = require('storage-mixin');
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import AppRegistry from 'hadron-app-registry';

import configureStore from '../../src/stores/recent-list-store';
import { comparableQuery } from './';

describe('comparableQuery', function () {
  let tmpDir;
  let tmpDirs = [];
  let store;
  let appRegistry;

  beforeEach(function () {
    tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'comparable-query-storage-tests')
    );
    tmpDirs.push(tmpDir);
    TestBackend.enable(tmpDir);
    appRegistry = new AppRegistry();
    store = configureStore({ localAppRegistry: appRegistry, namespace: 'foo' });
  });

  afterEach(function () {
    TestBackend.disable();
  });

  after(async function () {
    // The tests here perform async fs operations without waiting for their
    // completion. Removing the tmp directories while the tests still have
    // those active fs operations can make them fail, so we wait a bit here.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await Promise.all(
      tmpDirs.map((tmpDir) => fs.promises.rmdir(tmpDir, { recursive: true }))
    );
  });

  it('strips ampersand properties', function () {
    const recent = { filter: { foo: 1 } };

    store.addRecent(recent);
    expect(store.state.items.length).to.equal(1);

    const query = store.state.items.at(0);

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
