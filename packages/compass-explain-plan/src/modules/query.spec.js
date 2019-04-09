import reducer, { queryChanged, QUERY_CHANGED } from 'modules/query';

describe('query module', () => {
  describe('#queryChanged', () => {
    it('returns the QUERY_CHANGED action', () => {
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

  describe('#reducer', () => {
    context('when the action is not query changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal({
          filter: {},
          sort: null,
          project: null,
          skip: 0,
          limit: 0,
          collation: null,
          maxTimeMS: 5000
        });
      });
    });

    context('when the action is query changed', () => {
      it('returns the new state', () => {
        const query = {
          filter: {},
          sort: null,
          project: null,
          skip: 100,
          limit: 0,
          collation: null,
          maxTimeMS: 2000
        };

        expect(reducer(undefined, queryChanged(query))).to.deep.equal(query);
      });
    });
  });
});
