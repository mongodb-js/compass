// import StorageBackend from 'storage-mixin';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TestBackend } = require('storage-mixin');
import fs from 'fs';
import path from 'path';
import os from 'os';
import bson from 'bson';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';

import { configureStore } from '../stores/query-history-store';
import { RecentQuery } from '../models';
import { deleteFavorite, saveFavorite } from './favorite-queries';

// const TestBackend = StorageBackend.TestBackend;

describe('FavoritesListStore reducer', function () {
  let store;
  let tmpDir;

  beforeEach(function () {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'recent-list-store-tests'));
    // tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'recent-list-store-tests'));
    console.log(`aa\n\ntmpDir: ${tmpDir}\n\n`);
    TestBackend.enable(tmpDir);
    store = configureStore({
      namespace: 'test.test',
      localAppRegistry: new AppRegistry(),
    });
  });

  afterEach(function () {
    TestBackend.disable();
    fs.rmdirSync(tmpDir, { recursive: true });
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

    beforeEach(function () {
      store.dispatch(saveFavorite(recent, 'testing'));
      const model = store.getState().favoriteQueries.items.models[0];
      store.dispatch(deleteFavorite(model));
    });

    it('removes the favorite from the list', function () {
      expect(store.getState().favoriteQueries.items.length).to.equal(0);
    });
  });
});
