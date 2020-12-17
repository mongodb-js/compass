const assert = require('assert');
const Connection = require('../');

describe('Connection', () => {
  describe('title', () => {
    it('works with default host', () => {
      assert.strictEqual(
        new Connection({}).title,
        'localhost:27017'
      );
    });

    it('returns the hostname if the connection is srv', () => {
      assert.strictEqual(
        new Connection({
          isSrvRecord: true,
          hostname: 'somehost'
        }).title,
        'somehost'
      );
    });

    it('returns hosts if the connection is not srv', () => {
      assert.strictEqual(
        new Connection({ hosts: [{ host: 'example.com', port: 12345 }] }).title,
        'example.com:12345'
      );
    });

    it('returns the name of the favorite if connection is favorite', () => {
      assert.strictEqual(
        new Connection({
          isFavorite: true,
          name: 'Favorite Name'
        }).title,
        'Favorite Name'
      );
    });

    it('falls back to hostname if nothing else match', () => {
      assert.strictEqual(
        new Connection({
          isSrvRecord: false,
          isFavorite: false,
          hosts: [],
          hostname: 'somehost'
        }).title,
        'somehost'
      );
    });
  });

  describe('username', () => {
    it('returns empty by default', () => {
      assert.strictEqual(
        new Connection({}).username,
        ''
      );
    });

    it('returns empty if authStrategy is NONE', () => {
      assert.strictEqual(
        new Connection({
          authStrategy: 'NONE'
        }).username,
        ''
      );
    });

    [
      ['MONGODB', 'mongodbUsername'],
      ['KERBEROS', 'kerberosPrincipal'],
      ['X509', 'x509Username'],
      ['LDAP', 'ldapUsername']
    ].forEach(
      ([authStrategy, property]) => {
        describe(`when authStrategy is ${authStrategy}`, () => {
          let connection;

          beforeEach(() => {
            connection = new Connection({
              authStrategy,
              [property]: 'value-1'
            });
          });

          it(`returns ${property}`, () => {
            assert.strictEqual(
              connection.username,
              'value-1'
            );
          });

          it('updates with dependencies', () => {
            connection.set({ [property]: 'value-2' });
            assert.strictEqual(
              connection.username,
              'value-2'
            );
          });
        });
      }
    );
  });

  describe('#parse', () => {
    context('when the attributes have legacy passwords', () => {
      context('when the attributes have no new passwords', () => {
        it('maps mongodb_password', () => {
          assert.strictEqual(
            new Connection({ mongodb_password: 'test' }).mongodbPassword,
            'test'
          );
        });

        it('maps kerberos_password', () => {
          assert.strictEqual(
            new Connection({ kerberos_password: 'test' }).kerberosPassword,
            'test'
          );
        });

        it('maps ldap_password', () => {
          assert.strictEqual(
            new Connection({ ldap_password: 'test' }).ldapPassword,
            'test'
          );
        });

        it('maps ssl_private_key_password', () => {
          assert.strictEqual(
            new Connection({ ssl_private_key_password: 'test' }).sslPass,
            'test'
          );
        });

        it('maps ssh_tunnel_password', () => {
          assert.strictEqual(
            new Connection({ ssh_tunnel_password: 'test' }).sshTunnelPassword,
            'test'
          );
        });

        it('maps ssh_tunnel_passphrase', () => {
          assert.strictEqual(
            new Connection({ ssh_tunnel_passphrase: 'test' })
              .sshTunnelPassphrase,
            'test'
          );
        });
      });

      context('when the attributes have falsey values', () => {
        it('does not map mongodb_password', () => {
          assert.strictEqual(
            new Connection({ mongodb_password: '' }).mongodbPassword,
            undefined
          );
        });

        it('does not map kerberos_password', () => {
          assert.strictEqual(
            new Connection({ kerberos_password: '' }).kerberosPassword,
            undefined
          );
        });

        it('does not map ldap_password', () => {
          assert.strictEqual(
            new Connection({ ldap_password: '' }).ldapPassword,
            undefined
          );
        });

        it('does not map ssl_private_key_password', () => {
          assert.strictEqual(
            new Connection({ ssl_private_key_password: '' }).sslPass,
            undefined
          );
        });

        it('does not map ssh_tunnel_password', () => {
          assert.strictEqual(
            new Connection({ ssh_tunnel_password: '' }).sshTunnelPassword,
            undefined
          );
        });

        it('does not map ssh_tunnel_passphrase', () => {
          assert.strictEqual(
            new Connection({ ssh_tunnel_passphrase: '' }).sshTunnelPassphrase,
            undefined
          );
        });
      });

      context('when the attributes have new passwords', () => {
        it('does not map mongodb_password', () => {
          assert.strictEqual(
            new Connection({ mongodb_password: 'test', mongodbPassword: 'pw' })
              .mongodbPassword,
            'pw'
          );
        });

        it('does not map kerberos_password', () => {
          assert.strictEqual(
            new Connection({
              kerberos_password: 'test',
              kerberosPassword: 'pw'
            }).kerberosPassword,
            'pw'
          );
        });

        it('does not map ldap_password', () => {
          assert.strictEqual(
            new Connection({ ldap_password: 'test', ldapPassword: 'pw' })
              .ldapPassword,
            'pw'
          );
        });

        it('does not map ssl_private_key_password', () => {
          assert.strictEqual(
            new Connection({ ssl_private_key_password: 'test', sslPass: 'pw' })
              .sslPass,
            'pw'
          );
        });

        it('does not map ssh_tunnel_password', () => {
          assert.strictEqual(
            new Connection({
              ssh_tunnel_password: 'test',
              sshTunnelPassword: 'pw'
            }).sshTunnelPassword,
            'pw'
          );
        });

        it('does not map ssh_tunnel_passphrase', () => {
          assert.strictEqual(
            new Connection({
              ssh_tunnel_passphrase: 'test',
              sshTunnelPassphrase: 'pw'
            }).sshTunnelPassphrase,
            'pw'
          );
        });
      });
    });
  });
});
