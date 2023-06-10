import StorageMixin from 'storage-mixin';
import { expect } from 'chai';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import AppRegistry from 'hadron-app-registry';

import { configureStore } from '../stores/query-history-store';
import { comparableQuery } from './comparable-query';
import { addRecent } from '../modules/recent-queries';
import type { QueryModelType } from '../models/query';

const TestBackend = StorageMixin.TestBackend;

describe('comparableQuery', function () {
  let tmpDir: string;
  const tmpDirs: string[] = [];
  let store;
  let appRegistry;
  let i = 0;

  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), `comparable-query-storage-tests-${i++}`)
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
      tmpDirs.map((tmpDir) => fs.rm(tmpDir, { recursive: true }))
    );
  });

  it('strips ampersand properties', function () {
    const recent = { filter: { foo: 1 } };

    store.dispatch(addRecent(recent as unknown as QueryModelType));
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

  it('strips ampersand properties22', function () {
    const recent = { filter: { foo: 1 } };

    store.dispatch(addRecent(recent as unknown as QueryModelType));
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
