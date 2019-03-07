import reducer, {
  INITIAL_STATE,
  changeSshTunnel,
  CHANGE_SSH_TUNNEL
} from 'modules/ssh-tunnel';

describe('ssh-tunnel module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeSshTunnel('new sshTunnel'))).to.equal('new sshTunnel');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeSshTunnel', () => {
    it('returns the action', () => {
      expect(changeSshTunnel('new sshTunnel w action')).to.deep.equal({
        type: CHANGE_SSH_TUNNEL,
        sshTunnel: 'new sshTunnel w action'
      });
    });
  });
});
