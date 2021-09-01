
import reducer, {
  isLoadedChanged,
  IS_LOADED_CHANGED
} from './is-loaded';

describe('is-loaded module', () => {
  describe('#isLoadedChanged', () => {
    it('returns the IS_LOADED_CHANGED action', () => {
      expect(isLoadedChanged(true)).to.deep.equal({
        type: IS_LOADED_CHANGED,
        isLoaded: true
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not presented in is-loaded module', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });

    context('when the action is isLoadedChanged', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, isLoadedChanged(true))).to.equal(true);
      });
    });
  });
});
