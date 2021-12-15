const assert = require('assert');

const { redactSshTunnelOptions } = require('../lib/redact');

describe('redactSshTunnelOptions', () => {
  let baseOptions;

  beforeEach(() => {
    baseOptions = {
      readyTimeout: 'readyTimeout',
      forwardTimeout: 'forwardTimeout',
      keepaliveInterval: 'keepaliveInterval',
      srcAddr: 'srcAddr',
      dstPort: 'dstPort',
      dstAddr: 'dstAddr',
      localPort: 'localPort',
      localAddr: 'localAddr',
      host: 'host',
      port: 'port',
      username: 'username'
    };
  });

  [
    'password',
    'privateKey',
    'passphrase'
  ].forEach((key) => {
    it(`redacts '${key}'`, () => {
      assert.deepStrictEqual(
        redactSshTunnelOptions({
          ...baseOptions,
          [key]: 'secret'
        }),
        {
          ...baseOptions,
          [key]: '<redacted>'
        }
      );
    });
  });
});
