import reducer, { envChanged, ENV_CHANGED } from 'modules/env';

describe('env module', () => {
  describe('#envChanged', () => {
    it('returns the ENV_CHANGED action', () => {
      expect(envChanged('atlas')).to.deep.equal({
        type: ENV_CHANGED,
        env: 'atlas'
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not env changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal('on-prem');
      });
    });

    context('when the action is env changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, envChanged('atlas'))).to.equal('atlas');
      });
    });
  });
});
