const { expect } = require('chai');
const { FavoriteQuery, FavoriteQueryCollection } = require('../../');

describe('FavoriteQueryCollection', () => {
  describe('#add', () => {
    const collection = new FavoriteQueryCollection();
    const query = new FavoriteQuery({ filter: { name: 'test' } });

    before(() => {
      collection.add(query);
    });

    it('adds the query to the collection', () => {
      expect(collection.length).to.equal(1);
    });

    it('stores the model instance in the collection', () => {
      expect(collection.models[0]).to.deep.equal(query);
    });
  });

  describe('#new', () => {
    const query = new FavoriteQuery({ filter: { name: 'test' } });
    const collection = new FavoriteQueryCollection([ query ]);

    it('adds the query to the collection', () => {
      expect(collection.length).to.equal(1);
    });

    it('stores the model instance in the collection', () => {
      expect(collection.models[0]).to.deep.equal(query);
    });
  });

  context('when the collection has multiples', () => {
    const older = new Date('2014-01-01');
    const newer = new Date();
    const queryOne = new FavoriteQuery({ dateSaved: older, name: 'one' });
    const queryTwo = new FavoriteQuery({ dateSaved: newer, name: 'two' });
    const collection = new FavoriteQueryCollection([ queryOne, queryTwo ]);

    it('sorts the collection by dateSaved', () => {
      expect(collection.models[0].name).to.equal('two');
      expect(collection.models[1].name).to.equal('one');
    });
  });
});
