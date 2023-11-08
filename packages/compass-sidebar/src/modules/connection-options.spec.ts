import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  changeConnectionOptions,
} from './connection-options';

describe('connection options module', function () {
  it('correctly sets the initial state', function () {
    expect(reducer(undefined, {} as any)).to.deep.equal(INITIAL_STATE);
  });

  it('does not truncate hosts shorter than 25 characters', function () {
    expect(
      reducer(
        undefined,
        changeConnectionOptions({
          sshTunnel: {
            host: 'foo',
            port: '1234',
          },
        })
      )
    ).to.deep.equal({
      sshTunnel: true,
      sshTunnelHostPortString: 'foo:1234',
      sshTunnelHostname: 'foo',
      sshTunnelPort: '1234',
    });
  });

  it('truncates the middle of hosts that are longer than 25 characters', function () {
    expect(
      reducer(
        undefined,
        changeConnectionOptions({
          sshTunnel: {
            host: 'abcdefghijklmnopqrstuvwxyz',
            port: '2345',
          },
        })
      )
    ).to.deep.equal({
      sshTunnel: true,
      sshTunnelHostPortString: 'abcdefghi...rstuvwxyz:2345',
      sshTunnelHostname: 'abcdefghijklmnopqrstuvwxyz',
      sshTunnelPort: '2345',
    });
  });

  it('sets sshTunnelHostPortString to a blank string if sshTunnel is not set', function () {
    expect(reducer(undefined, changeConnectionOptions({}))).to.deep.equal({
      sshTunnel: false,
      sshTunnelHostPortString: '',
      sshTunnelHostname: '',
      sshTunnelPort: '',
    });
  });
});
