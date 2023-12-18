import { expect } from 'chai';

import reducer, {
  serverVersionChanged,
  SERVER_VERSION_CHANGED,
} from './server-version';

describe('server version module', function () {
  describe('#serverVersionChanged', function () {
    it('returns the SERVER_VERSION_CHANGED action', function () {
      expect(serverVersionChanged('3.0.0')).to.deep.equal({
        type: SERVER_VERSION_CHANGED,
        version: '3.0.0',
      });
    });
  });

  describe('#reducer', function () {
    context('when the action is not server version changed', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' } as any)).to.equal('4.0.0');
      });
    });

    context('when the action is server version changed', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, serverVersionChanged('3.0.0'))).to.equal(
          '3.0.0'
        );
      });
    });
  });
});
