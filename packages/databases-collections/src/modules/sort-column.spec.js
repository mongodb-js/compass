import reducer, { INITIAL_STATE } from './sort-column';
import { sortCollections } from './collections/collections';

describe('sort column module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new column', () => {
        expect(
          reducer(undefined, sortCollections('Collections', ''))
        ).to.equal('Collections');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });
});
