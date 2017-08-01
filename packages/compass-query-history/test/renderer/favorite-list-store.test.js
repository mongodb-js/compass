const { expect } = require('chai');
const { FavoriteListStore, RecentQuery } = require('../../');

describe('FavoriteListStore', () => {
  describe('#init', () => {
    it('initializes with the favorite list', () => {
      expect(FavoriteListStore.state.favorites.length).to.equal(0);
    });
  });

  describe('#saveFavorite', () => {
    const ns = 'db.test';
    const filter = { name: 'test' };
    const recent = new RecentQuery({ ns: ns, filter: filter });
    let model;

    before(() => {
      FavoriteListStore.saveFavorite(recent, 'testing');
      model = FavoriteListStore.state.favorites.models[0];
    });

    after(() => {
      FavoriteListStore.deleteFavorite(model);
    });

    it('adds the favorite to the list', () => {
      expect(FavoriteListStore.state.favorites.length).to.equal(1);
    });

    it('adds the _dateSaved attributes', () => {
      expect(model._dateSaved).to.not.equal(null);
    });

    it('saves the name', () => {
      expect(model._name).to.equal('testing');
    });
  });

  describe('#deleteFavorite', () => {
    const ns = 'db.test';
    const filter = { name: 'test' };
    const recent = new RecentQuery({ ns: ns, filter: filter });

    before(() => {
      FavoriteListStore.saveFavorite(recent, 'testing');
      const model = FavoriteListStore.state.favorites.models[0];
      FavoriteListStore.deleteFavorite(model);
    });

    it('removes the favorite from the list', () => {
      expect(FavoriteListStore.state.favorites.length).to.equal(0);
    });
  });
});
