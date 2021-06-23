const assert = require('assert');

const {
  redactSshTunnelOptions,
  redactConnectionString
} = require('../lib/redact');

describe('redactConnectionString', () => {
  describe('redact credentials', () => {
    context('when url contains credentials', () => {
      it('returns the <credentials> in output instead of password', () => {
        assert.strictEqual(
          redactConnectionString('mongodb+srv://admin:catsc@tscat3ca1s@cats-data-sets-e08dy.mongodb.net/admin'),
          'mongodb+srv://<credentials>@cats-data-sets-e08dy.mongodb.net/admin'
        );
      });

      it('returns the <credentials> in output instead of IAM session token', () => {
        assert.strictEqual(
          redactConnectionString('mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3Asampletoken,else%3Amiau&param=true'),
          'mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3A<credentials>,else%3Amiau&param=true'
        );
        assert.strictEqual(
          redactConnectionString('mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3Asampletoken&param=true'),
          'mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3A<credentials>&param=true'
        );
        assert.strictEqual(
          redactConnectionString('mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3Asampletoken'),
          'mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3A<credentials>'
        );
      });

      it('returns the <credentials> in output instead of password and IAM session token', () => {
        assert.strictEqual(
          redactConnectionString('mongodb+srv://admin:tscat3ca1s@cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3Asampletoken&param=true'),
          'mongodb+srv://<credentials>@cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3A<credentials>&param=true'
        );
      });
    });
  });
});

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
