import { expect } from 'chai';

import reducer, {
  readonlyViewChanged,
  READONLY_VIEW_CHANGED,
} from './is-readonly-view';

describe('is readonly view module', function () {
  describe('#reducer', function () {
    context('when an action is not READONLY_VIEW_CHANGED', function () {
      it('returns the state', function () {
        expect(reducer(false, { type: 'test' })).to.equal(false);
      });
    });

    context('when an action is READONLY_VIEW_CHANGED', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, readonlyViewChanged(true))).to.equal(true);
      });
    });
  });

  describe('#readonlyViewChanged', function () {
    it('returns the action', function () {
      expect(readonlyViewChanged(true)).to.deep.equal({
        type: READONLY_VIEW_CHANGED,
        isReadonlyView: true,
      });
    });
  });
});
