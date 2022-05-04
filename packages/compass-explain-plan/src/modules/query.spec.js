import { expect } from 'chai';

import reducer, { queryChanged, QUERY_CHANGED } from './query';

describe('query module', function() {
  describe('#queryChanged', function() {
    it('returns the QUERY_CHANGED action', function() {
      const query = {
        filter: {},
        sort: null,
        project: null,
        skip: 100,
        limit: 0,
        collation: null
      };

      expect(queryChanged(query)).to.deep.equal({type: QUERY_CHANGED, query});
    });
  });

  describe('#reducer', function() {
    context('when the action is not query changed', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal({
          filter: {},
          sort: null,
          project: null,
          skip: 0,
          limit: 0,
          collation: null,
          maxTimeMS: 5000,
          isChanged: false
        });
      });
    });

    context('when the action is query changed', function() {
      it('returns the new state', function() {
        const query = {
          filter: {},
          sort: null,
          project: null,
          skip: 100,
          limit: 0,
          collation: null,
          maxTimeMS: 2000,
          isChanged: true
        };

        expect(reducer(undefined, queryChanged(query))).to.deep.equal(query);
      });
    });
  });
});
