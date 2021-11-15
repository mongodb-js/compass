import reducer, { INITIAL_STATE } from './sort-order';
import { sortCollections } from './collections/collections';

describe('sort order module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new order', () => {
        expect(reducer(undefined, sortCollections('', 'desc'))).to.equal('desc');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });
});
