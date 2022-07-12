import { expect } from 'chai';

import { RecentQuery, RecentQueryCollection } from '../../src/models';

describe('RecentQueryCollection [Model]', function() {
  describe('#add', function() {
    const collection = new RecentQueryCollection();
    const query = new RecentQuery({ filter: { name: 'test' } });

    before(function() {
      collection.add(query);
    });

    it('adds the query to the collection', function() {
      expect(collection.length).to.equal(1);
    });

    it('stores the model instance in the collection', function() {
      expect(collection.models[0]).to.deep.equal(query);
    });
  });

  describe('#new', function() {
    const query = new RecentQuery({ filter: { name: 'test' } });
    const collection = new RecentQueryCollection([ query ]);

    it('adds the query to the collection', function() {
      expect(collection.length).to.equal(1);
    });

    it('stores the model instance in the collection', function() {
      expect(collection.models[0]).to.deep.equal(query);
    });
  });

  context('when the collection has multiples', function() {
    const older = new Date('2014-01-01');
    const newer = new Date();
    const queryOne = new RecentQuery({ _lastExecuted: older, filter: {'one': 1} });
    const queryTwo = new RecentQuery({ _lastExecuted: newer, filter: {'two': 1} });
    const collection = new RecentQueryCollection([ queryOne, queryTwo ]);

    it('sorts the collection by _dateSaved', function() {
      expect(collection.models[0].filter).to.deep.equal({'two': 1});
      expect(collection.models[1].filter).to.deep.equal({'one': 1});
    });
  });
});
