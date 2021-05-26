import reducer, { INITIAL_STATE } from './sort-column';
import { sortIndexes } from './indexes';

describe('sort column module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new column', () => {
        expect(reducer(undefined, sortIndexes(null, 'Size', ''))).to.equal('Size');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });
});
