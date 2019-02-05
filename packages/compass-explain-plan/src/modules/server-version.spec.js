import reducer, {
  serverVersionChanged,
  SERVER_VERSION_CHANGED
} from 'modules/server-version';

describe('server version module', () => {
  describe('#serverVersionChanged', () => {
    it('returns the SERVER_VERSION_CHANGED action', () => {
      expect(serverVersionChanged('3.0.0')).to.deep.equal({
        type: SERVER_VERSION_CHANGED,
        version: '3.0.0'
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not server version changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal('4.0.0');
      });
    });

    context('when the action is server version changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, serverVersionChanged('3.0.0'))).to.equal('3.0.0');
      });
    });
  });
});
