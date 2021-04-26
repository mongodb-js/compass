import reducer, { toggleComments, TOGGLE_COMMENTS } from 'modules/comments';

describe('comments module', () => {
  describe('#toggleComments', () => {
    it('returns the TOGGLE_COMMENTS action', () => {
      expect(toggleComments()).to.deep.equal({
        type: TOGGLE_COMMENTS
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not toggle comments', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(true);
      });
    });

    context('when the action is toggle comments', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleComments())).to.equal(false);
      });
    });
  });
});
