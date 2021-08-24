/* eslint-disable mocha/no-mocha-arrows */
import assert from 'assert';

import { redactSshTunnelOptions, redactConnectionString } from '../lib/redact';

describe('redact', () => {
  describe('redactConnectionString', function () {
    describe('redact credentials', function () {
      describe('when url contains credentials', function () {
        it('returns the <credentials> in output instead of password', function () {
          assert.strictEqual(
            redactConnectionString(
              'mongodb+srv://admin:catsc@tscat3ca1s@cats-data-sets-e08dy.mongodb.net/admin'
            ),
            'mongodb+srv://<credentials>@cats-data-sets-e08dy.mongodb.net/admin'
          );
        });

        it('returns the <credentials> in output instead of IAM session token', function () {
          assert.strictEqual(
            redactConnectionString(
              'mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3Asampletoken,else%3Amiau&param=true'
            ),
            'mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3A<credentials>,else%3Amiau&param=true'
          );
          assert.strictEqual(
            redactConnectionString(
              'mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3Asampletoken&param=true'
            ),
            'mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3A<credentials>&param=true'
          );
          assert.strictEqual(
            redactConnectionString(
              'mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3Asampletoken'
            ),
            'mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3A<credentials>'
          );
        });

        it('returns the <credentials> in output instead of password and IAM session token', function () {
          assert.strictEqual(
            redactConnectionString(
              'mongodb+srv://admin:tscat3ca1s@cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3Asampletoken&param=true'
            ),
            'mongodb+srv://<credentials>@cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3A<credentials>&param=true'
          );
        });
      });
    });
  });

  describe('redactSshTunnelOptions', function () {
    let baseOptions;

    beforeEach(function () {
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
          }),
          {
            ...baseOptions,
            [key]: '<redacted>',
          }
        );
      });
    });
  });
});
