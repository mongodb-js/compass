import reducer, {
  INITIAL_STATE,
  changeErrorMessage,
  CHANGE_ERROR_MESSAGE
} from 'modules/error-message';

describe('error-message module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeErrorMessage('new errorMessage'))).to.equal('new errorMessage');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeErrorMessage', () => {
    it('returns the action', () => {
      expect(changeErrorMessage('new errorMessage w action')).to.deep.equal({
        type: CHANGE_ERROR_MESSAGE,
        errorMessage: 'new errorMessage w action'
      });
    });
  });
});
