/* eslint-disable mocha/no-mocha-arrows */
import type { SshTunnelConfig } from '@mongodb-js/ssh-tunnel';
import assert from 'assert';
import { redactSshTunnelOptions } from './redact';

describe('redact', () => {
  describe('redactSshTunnelOptions', function () {
    let baseOptions: Partial<SshTunnelConfig>;

    beforeEach(function () {
      baseOptions = {
        readyTimeout: 10,
        keepaliveInterval: 10,
        srcAddr: 'srcAddr',
        dstPort: 22,
        dstAddr: 'dstAddr',
        localPort: 22222,
        localAddr: 'localAddr',
        host: 'host',
        port: 27017,
        username: 'username',
      };
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    ['password', 'privateKey', 'passphrase'].forEach((key) => {
      it(`redacts '${key}'`, function () {
        assert.deepStrictEqual(
          redactSshTunnelOptions({
            ...baseOptions,
            [key]: 'secret',
          } as SshTunnelConfig),
          {
            ...baseOptions,
            [key]: '<redacted>',
          }
        );
      });
    });
  });
});
