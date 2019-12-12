const assert = require('assert');
const Connection = require('../');

describe('Connection', () => {
  describe('#parse', () => {
    context('when the attributes have legacy passwords', () => {
      context('when the attributes have no new passwords', () => {
        it('maps mongodb_password', () => {
          assert.equal(
            new Connection({ mongodb_password: 'test' }).mongodbPassword,
            'test'
          );
        });

        it('maps kerberos_password', () => {
          assert.equal(
            new Connection({ kerberos_password: 'test' }).kerberosPassword,
            'test'
          );
        });

        it('maps ldap_password', () => {
          assert.equal(
            new Connection({ ldap_password: 'test' }).ldapPassword,
            'test'
          );
        });

        it('maps ssl_private_key_password', () => {
          assert.equal(
            new Connection({ ssl_private_key_password: 'test' }).sslPass,
            'test'
          );
        });

        it('maps ssh_tunnel_password', () => {
          assert.equal(
            new Connection({ ssh_tunnel_password: 'test' }).sshTunnelPassword,
            'test'
          );
        });

        it('maps ssh_tunnel_passphrase', () => {
          assert.equal(
            new Connection({ ssh_tunnel_passphrase: 'test' }).sshTunnelPassphrase,
            'test'
          );
        });
      });

      context('when the attributes have falsey values', () => {
        it('does not map mongodb_password', () => {
          assert.equal(
            new Connection({ mongodb_password: '' }).mongodbPassword,
            undefined
          );
        });

        it('does not map kerberos_password', () => {
          assert.equal(
            new Connection({ kerberos_password: '' }).kerberosPassword,
            undefined
          );
        });

        it('does not map ldap_password', () => {
          assert.equal(
            new Connection({ ldap_password: '' }).ldapPassword,
            undefined
          );
        });

        it('does not map ssl_private_key_password', () => {
          assert.equal(
            new Connection({ ssl_private_key_password: '' }).sslPass,
            undefined
          );
        });

        it('does not map ssh_tunnel_password', () => {
          assert.equal(
            new Connection({ ssh_tunnel_password: '' }).sshTunnelPassword,
            undefined
          );
        });

        it('does not map ssh_tunnel_passphrase', () => {
          assert.equal(
            new Connection({ ssh_tunnel_passphrase: '' }).sshTunnelPassphrase,
            undefined
          );
        });
      });

      context('when the attributes have new passwords', () => {
        it('does not map mongodb_password', () => {
          assert.equal(
            new Connection({ mongodb_password: 'test', mongodbPassword: 'pw' }).mongodbPassword,
            'pw'
          );
        });

        it('does not map kerberos_password', () => {
          assert.equal(
            new Connection({ kerberos_password: 'test', kerberosPassword: 'pw' }).kerberosPassword,
            'pw'
          );
        });

        it('does not map ldap_password', () => {
          assert.equal(
            new Connection({ ldap_password: 'test', ldapPassword: 'pw' }).ldapPassword,
            'pw'
          );
        });

        it('does not map ssl_private_key_password', () => {
          assert.equal(
            new Connection({ ssl_private_key_password: 'test', sslPass: 'pw' }).sslPass,
            'pw'
          );
        });

        it('does not map ssh_tunnel_password', () => {
          assert.equal(
            new Connection({ ssh_tunnel_password: 'test', sshTunnelPassword: 'pw' }).sshTunnelPassword,
            'pw'
          );
        });

        it('does not map ssh_tunnel_passphrase', () => {
          assert.equal(
            new Connection({ ssh_tunnel_passphrase: 'test', sshTunnelPassphrase: 'pw' }).sshTunnelPassphrase,
            'pw'
          );
        });
      });
    });
  });
});
