import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  changedToRegularIndexes,
  changedToSearchIndexes,
} from './index-list';

describe('index-list view module', function () {
  describe('#reducer', function () {
    context('when an action is not valid', function () {
      it('returns the state', function () {
        expect(reducer(INITIAL_STATE, { type: 'test' })).to.equal(
          INITIAL_STATE
        );
      });
    });

    context('when an action is changedToRegularIndexes', function () {
      it('state is regular-indexes', function () {
        expect(reducer(INITIAL_STATE, changedToRegularIndexes())).to.equal(
          'regular-indexes'
        );
      });
    });

    context('when an action is changedToSearchIndexes', function () {
      it('state is search-indexes', function () {
        expect(reducer(INITIAL_STATE, changedToSearchIndexes())).to.equal(
          'search-indexes'
        );
      });
    });
  });
});
