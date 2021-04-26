import { RecentQuery, RecentQueryCollection } from 'models';

describe('RecentQueryCollection [Model]', () => {
  describe('#add', () => {
    const collection = new RecentQueryCollection();
    const query = new RecentQuery({ filter: { name: 'test' } });

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
    const query = new RecentQuery({ filter: { name: 'test' } });
    const collection = new RecentQueryCollection([ query ]);

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
    const queryOne = new RecentQuery({ _lastExecuted: older, filter: {'one': 1} });
    const queryTwo = new RecentQuery({ _lastExecuted: newer, filter: {'two': 1} });
    const collection = new RecentQueryCollection([ queryOne, queryTwo ]);

    it('sorts the collection by _dateSaved', () => {
      expect(collection.models[0].filter).to.deep.equal({'two': 1});
      expect(collection.models[1].filter).to.deep.equal({'one': 1});
    });
  });
});
