import stages from 'reducers/server-version';
import { serverVersionChanged } from 'action-creators';

describe('server version reducer', () => {
  describe('#serverVersion', () => {
    context('when the action is not server version changed', () => {
      it('returns the default state', () => {
        expect(stages(undefined, { type: 'test' })).to.equal('3.6.0');
      });
    });

    context('when the action is stage changed', () => {
      it('returns the new state', () => {
        expect(stages(undefined, serverVersionChanged('3.0.0'))).to.equal('3.0.0');
      });
    });
  });
});
