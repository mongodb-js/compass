import bson from 'bson';
import configureStore from '../../src/stores/favorite-list-store';
import configureActions from 'actions';
import { RecentQuery } from 'models';

describe('FavoritesListStore [Store]', () => {
  const actions = configureActions();
  let store;

  beforeEach(() => {
    store = configureStore({ actions: actions });
  });

  describe('#init', () => {
    it('initializes with the favorite list', () => {
      expect(store.state.items.length).to.equal(0);
    });
  });

  describe('#saveFavorite', () => {
    context('when no complex bson types are in the attributes', () => {
      const ns = 'db.test';
      const filter = { name: 'test' };
      const recent = new RecentQuery({ ns: ns, filter: filter });
      let model;

      beforeEach(() => {
        store.saveFavorite(recent, 'testing');
        model = store.state.items.models[0];
      });

      afterEach(() => {
        store.deleteFavorite(model);
      });

      it('adds the favorite to the list', () => {
        expect(store.state.items.length).to.equal(1);
      });

      it('adds the _dateSaved attributes', () => {
        expect(model._dateSaved).to.not.equal(null);
      });

      it('saves the name', () => {
        expect(model._name).to.equal('testing');
      });
    });

    context('when complex bson types are in the attributes', () => {
      const ns = 'db.test';
      const oid = new bson.ObjectId();
      const filter = { _id: oid };
      const recent = new RecentQuery({ ns: ns, filter: filter });
      let model;

      beforeEach(() => {
        store.saveFavorite(recent, 'testing');
        model = store.state.items.models[0];
      });

      afterEach(() => {
        store.deleteFavorite(model);
      });

      it('adds the favorite to the list', () => {
        expect(store.state.items.length).to.equal(1);
      });
    });
  });

  describe('#deleteFavorite', () => {
    const ns = 'db.test';
    const filter = { name: 'test' };
    const recent = new RecentQuery({ ns: ns, filter: filter });

    before(() => {
      store.saveFavorite(recent, 'testing');
      const model = store.state.items.models[0];
      store.deleteFavorite(model);
    });

    it('removes the favorite from the list', () => {
      expect(store.state.items.length).to.equal(0);
    });
  });
});
