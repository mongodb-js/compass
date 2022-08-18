import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleHasIndexName,
  TOGGLE_HAS_INDEX_NAME,
} from '../create-index/has-index-name';

describe('create index has index name module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, toggleHasIndexName(true))).to.equal(true);
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleHasIndexName', function () {
    it('returns the action', function () {
      expect(toggleHasIndexName(false)).to.deep.equal({
        type: TOGGLE_HAS_INDEX_NAME,
        hasIndexName: false,
      });
    });
  });
});
