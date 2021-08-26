/* eslint-disable mocha/no-mocha-arrows */
import { SshTunnelConfig } from '@mongodb-js/ssh-tunnel';
import assert from 'assert';
import { redactConnectionString, redactSshTunnelOptions } from './redact';

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
