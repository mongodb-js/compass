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

  describe('#onConnected', () => {
    context('when the host is less that 25 chars', () => {
      const dataService = {
        client: {
          model: {
            sshTunnel: 'USER_PASSWORD',
            ssh_tunnel_hostname: '123.45.67.8',
            ssh_tunnel_options: {
              dstPort: '27019'
            }
          }
        }
      };

      it('triggers with the full host and port', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.sshTunnel).to.equal(true);
          expect(state.sshTunnelHostPortString).to.equal('123.45.67.8:27019');
          done();
        });
        Store.onConnected(null, dataService);
      });
    });

    context('when teh host is greater than 25 characters', () => {
      const dataService = {
        client: {
          model: {
            sshTunnel: 'USER_PASSWORD',
            ssh_tunnel_hostname: 'areallylong.amazonlikeaws.com',
            ssh_tunnel_options: {
              dstPort: '27019'
            }
          }
        }
      };

      it('triggers with the full host and port', (done) => {
        const unsubscribe = Store.listen((state) => {
          unsubscribe();
          expect(state.sshTunnel).to.equal(true);
          expect(state.sshTunnelHostPortString).to.equal('areallylo...keaws.com:27019');
          done();
        });
        Store.onConnected(null, dataService);
      });
    });
  });
});
