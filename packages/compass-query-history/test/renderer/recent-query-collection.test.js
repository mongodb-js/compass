const { expect } = require('chai');
const { RecentQuery, RecentQueryCollection } = require('../../');

describe('RecentQueryCollection', () => {
  describe('#add', () => {
    const collection = new RecentQueryCollection();
    const query = new RecentQuery({ filter: "{ name: 'test' }" });

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
    const query = new RecentQuery({ filter: "{ name: 'test' }" });
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
    const queryOne = new RecentQuery({ lastExecuted: older, filter: 'one' });
    const queryTwo = new RecentQuery({ lastExecuted: newer, filter: 'two' });
    const collection = new RecentQueryCollection([ queryOne, queryTwo ]);

    it('sorts the collection by dateSaved', () => {
      expect(collection.models[0].filter).to.equal('two');
      expect(collection.models[1].filter).to.equal('one');
    });
  });
});
