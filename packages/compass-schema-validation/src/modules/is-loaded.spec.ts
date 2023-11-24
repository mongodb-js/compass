import { expect } from 'chai';

import reducer, { isLoadedChanged, IS_LOADED_CHANGED } from './is-loaded';

describe('is-loaded module', function () {
  describe('#isLoadedChanged', function () {
    it('returns the IS_LOADED_CHANGED action', function () {
      expect(isLoadedChanged(true)).to.deep.equal({
        type: IS_LOADED_CHANGED,
        isLoaded: true,
      });
    });
  });

  describe('#reducer', function () {
    context(
      'when the action is not presented in is-loaded module',
      function () {
        it('returns the default state', function () {
          expect(reducer(undefined, { type: 'test' } as any)).to.equal(false);
        });
      }
    );

    context('when the action is isLoadedChanged', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, isLoadedChanged(true))).to.equal(true);
      });
    });
  });
});
