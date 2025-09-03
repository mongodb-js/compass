import { expect } from 'chai';

import reducer, {
  COLL_INITIAL_STATE,
  switchToRegularIndexes,
  switchToSearchIndexes,
} from './index-view';

describe('index-view view module', function () {
  describe('#reducer', function () {
    context('when an action is not valid', function () {
      it('returns the state', function () {
        expect(reducer(COLL_INITIAL_STATE, { type: 'test' })).to.equal(
          COLL_INITIAL_STATE
        );
      });
    });

    context('when an action is switchToRegularIndexes', function () {
      it('state is regular-indexes', function () {
        expect(reducer(COLL_INITIAL_STATE, switchToRegularIndexes())).to.equal(
          'regular-indexes'
        );
      });
    });

    context('when an action is switchToSearchIndexes', function () {
      it('state is search-indexes', function () {
        expect(reducer(COLL_INITIAL_STATE, switchToSearchIndexes())).to.equal(
          'search-indexes'
        );
      });
    });
  });
});
