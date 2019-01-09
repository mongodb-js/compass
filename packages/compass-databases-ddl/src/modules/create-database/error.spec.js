import reducer, {
  INITIAL_STATE,
  handleError,
  HANDLE_ERROR
} from 'modules/create-database/error';

describe('handle error name module', () => {
  const error = new Error('testing');

  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, handleError(error))).to.equal(error);
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
});
