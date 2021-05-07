import Store from 'stores';

describe('SshTunnelStatusStore [Store]', () => {
  beforeEach(() => {
    Store.setState(Store.getInitialState());
  });

  it('defaults sshTunnel to false', () => {
    expect(Store.state.sshTunnel).to.equal(false);
  });

  it('defaults sshTunnelHostname to empty', () => {
    expect(Store.state.sshTunnelHostname).to.equal('');
  });

  it('defaults sshTunnelPort to empty', () => {
    expect(Store.state.sshTunnelPort).to.equal('');
  });

  it('defaults sshTunnelHostPortString to empty', () => {
    expect(Store.state.sshTunnelHostPortString).to.equal('');
  });
});
