import reducer, {
  INITIAL_STATE,
  clearError,
  handleError,
  CLEAR_ERROR,
  HANDLE_ERROR
} from 'modules/create-database/error';

describe('handle error name module', () => {
  const error = new Error('testing');

  describe('#reducer', () => {
    context('when an action is provided', () => {
      context('when the action is handle error', () => {
        it('returns the new state', () => {
          expect(reducer(undefined, handleError(error))).to.equal(error);
        });
      });

      context('when the action is clear error', () => {
        it('returns null', () => {
          expect(reducer(undefined, clearError())).to.equal(null);
        });
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#handleError', () => {
    it('returns the action', () => {
      expect(handleError(error)).to.deep.equal({
        type: HANDLE_ERROR,
        error: error
      });
    });
  });

  describe('#clearError', () => {
    it('returns the action', () => {
      expect(clearError()).to.deep.equal({
        type: CLEAR_ERROR
      });
    });
  });
});
