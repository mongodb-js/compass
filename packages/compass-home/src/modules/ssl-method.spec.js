import reducer, {
  INITIAL_STATE,
  changeSslMethod,
  CHANGE_SSL_METHOD
} from 'modules/ssl-method';

describe('ssl method module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        const sslMethod = 'new ssl method';

        expect(reducer(undefined, changeSslMethod(sslMethod))).to.equal(sslMethod);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeSslMethod', () => {
    it('returns the action', () => {
      const sslMethod = 'new ssl method w action';

      expect(changeSslMethod(sslMethod)).to.deep.equal({
        type: CHANGE_SSL_METHOD,
        sslMethod
      });
    });
  });
});
