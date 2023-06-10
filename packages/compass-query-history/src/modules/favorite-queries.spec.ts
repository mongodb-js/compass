import StorageMixin from 'storage-mixin';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import bson from 'bson';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';

import { configureStore } from '../stores/query-history-store';
import { RecentQuery } from '../models';
import {
  deleteFavorite,
  loadFavoriteQueries,
  saveFavorite,
} from './favorite-queries';

const TestBackend = StorageMixin.TestBackend;

describe('FavoritesQueries module', function () {
  let store;
  let tmpDir: string;
  const tmpDirs: string[] = [];
  let i = 0;

  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), `favorite-queries-module-tests-${i++}`)
    );
    tmpDirs.push(tmpDir);
    TestBackend.enable(tmpDir);
    store = configureStore({
      namespace: 'test.test',
      localAppRegistry: new AppRegistry(),
    });
    // Ensure the queries have been loaded.
    await store.dispatch(loadFavoriteQueries() as any);
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

  describe('#init', function () {
    it('initializes with the favorite list', function () {
      expect(store.getState().favoriteQueries.items.length).to.equal(0);
    });
  });

  describe('#saveFavorite', function () {
    context('when no complex bson types are in the attributes', function () {
      const ns = 'db.test';
      const filter = { name: 'test' };
      const recent = new RecentQuery({ ns: ns, filter: filter });
      let model;

      beforeEach(async function () {
        await store.dispatch(saveFavorite(recent, 'testing'));
        model = store.getState().favoriteQueries.items.models[0];
      });

      afterEach(async function () {
        await store.dispatch(deleteFavorite(model));
      });

      it('adds the favorite to the list', function () {
        expect(store.getState().favoriteQueries.items.length).to.equal(1);
      });

      it('adds the _dateSaved attributes', function () {
        expect(model._dateSaved).to.not.equal(null);
      });

      it('saves the name', function () {
        expect(model._name).to.equal('testing');
      });
    });

    context('when complex bson types are in the attributes', function () {
      const ns = 'db.test';
      const oid = new bson.ObjectId();
      const filter = { _id: oid };
      const recent = new RecentQuery({ ns: ns, filter: filter });
      let model;

      beforeEach(function () {
        store.dispatch(saveFavorite(recent, 'testing'));
        model = store.getState().favoriteQueries.items.models[0];
      });

      afterEach(function () {
        store.dispatch(deleteFavorite(model));
      });

      it('adds the favorite to the list', function () {
        expect(store.getState().favoriteQueries.items.length).to.equal(1);
      });
    });
  });

  describe('#deleteFavorite', function () {
    const ns = 'db.test';
    const filter = { name: 'test' };
    const recent = new RecentQuery({ ns: ns, filter: filter });

    beforeEach(async function () {
      await store.dispatch(saveFavorite(recent, 'testing'));
      const model = store.getState().favoriteQueries.items.models[0];
      await store.dispatch(deleteFavorite(model));
    });

    it('removes the favorite from the list', function () {
      expect(store.getState().favoriteQueries.items.length).to.equal(0);
    });
  });
});
