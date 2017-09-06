import { FavoriteQuery, FavoriteQueryCollection } from 'models';

describe('FavoriteQueryCollection [Model]', () => {
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
    const query = new FavoriteQuery({ filter: { _name: 'test' } });
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
    const queryOne = new FavoriteQuery({ _dateSaved: older, _name: 'one' });
    const queryTwo = new FavoriteQuery({ _dateSaved: newer, _name: 'two' });
    const collection = new FavoriteQueryCollection([ queryOne, queryTwo ]);

    it('sorts the collection by _dateSaved', () => {
      expect(collection.models[0]._name).to.equal('two');
      expect(collection.models[1]._name).to.equal('one');
    });
  });
});
