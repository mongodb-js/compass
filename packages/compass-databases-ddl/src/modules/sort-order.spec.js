import reducer, { INITIAL_STATE } from './/sort-order';
import { sortDatabases } from './/databases';

describe('sort order module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new order', () => {
        expect(reducer(undefined, sortDatabases(null, '', 'desc'))).to.equal('desc');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });
});
