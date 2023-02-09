import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  columnstoreProjectionChanged,
  COLUMNSTORE_PROJECTION_CHANGED,
} from '../create-index/columnstore-projection';

describe('create index columnstore projection module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(
          reducer(
            undefined,
            columnstoreProjectionChanged("{ testkey: 'testvalue' }")
          )
        ).to.deep.equal("{ testkey: 'testvalue' }");
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#columnstoreProjectionChanged', function () {
    it('returns the action', function () {
      expect(
        columnstoreProjectionChanged("{ testkey: 'testvalue' }")
      ).to.deep.equal({
        type: COLUMNSTORE_PROJECTION_CHANGED,
        columnstoreProjection: "{ testkey: 'testvalue' }",
      });
    });
  });
});
