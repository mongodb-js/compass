import reducer, { envChanged, ENV_CHANGED } from './env';
import { expect } from 'chai';

describe('env module', function() {
  describe('#envChanged', function() {
    it('returns the ENV_CHANGED action', function() {
      expect(envChanged('atlas')).to.deep.equal({
        type: ENV_CHANGED,
        env: 'atlas'
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not env changed', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal('on-prem');
      });
    });

    context('when the action is env changed', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, envChanged('atlas'))).to.equal('atlas');
      });
    });
  });
});
