import reducer, { INITIAL_STATE } from 'modules/columns';

describe('columns module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, undefined)).to.equal(INITIAL_STATE);
      });
    });
  });
});
