const { TestBackend } = require('storage-mixin');
import fs from 'fs';
import path from 'path';
import os from 'os';
import bson from 'bson';
import { expect } from 'chai';

import configureStore from '../../src/stores/favorite-list-store';
import configureActions from '../../src/actions';
import { RecentQuery } from '../../src/models';

describe('FavoritesListStore [Store]', function () {
  const actions = configureActions();
  let store;
  let tmpDir;

  beforeEach(function () {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'recent-list-store-tests'));
    TestBackend.enable(tmpDir);
    store = configureStore({ actions: actions });
  });

  afterEach(function () {
    TestBackend.disable();
    fs.rmdirSync(tmpDir, { recursive: true });
  });

  describe('#init', function () {
    it('initializes with the favorite list', function () {
      expect(store.state.items.length).to.equal(0);
    });
  });

  describe('#saveFavorite', function () {
    context('when no complex bson types are in the attributes', function () {
      const ns = 'db.test';
      const filter = { name: 'test' };
      const recent = new RecentQuery({ ns: ns, filter: filter });
      let model;

      beforeEach(function () {
        store.saveFavorite(recent, 'testing');
        model = store.state.items.models[0];
      });

      afterEach(function () {
        store.deleteFavorite(model);
      });

      it('adds the favorite to the list', function () {
        expect(store.state.items.length).to.equal(1);
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
        store.saveFavorite(recent, 'testing');
        model = store.state.items.models[0];
      });

      afterEach(function () {
        store.deleteFavorite(model);
      });

      it('adds the favorite to the list', function () {
        expect(store.state.items.length).to.equal(1);
      });
    });
  });

  describe('#deleteFavorite', function () {
    const ns = 'db.test';
    const filter = { name: 'test' };
    const recent = new RecentQuery({ ns: ns, filter: filter });

    beforeEach(function () {
      store.saveFavorite(recent, 'testing');
      const model = store.state.items.models[0];
      store.deleteFavorite(model);
    });

    it('removes the favorite from the list', function () {
      expect(store.state.items.length).to.equal(0);
    });
  });
});
