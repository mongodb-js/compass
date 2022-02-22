import { expect } from 'chai';
import type { ConnectionInfo } from './connection-info';
import type { ConnectionSecrets } from './connection-secrets';
import { mergeSecrets, extractSecrets } from './connection-secrets';

describe('connection secrets', function () {
  describe('mergeSecrets', function () {
    it('does not modify the original object', function () {
      const originalConnectionInfo: ConnectionInfo = {
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017',
          sshTunnel: {
            host: 'localhost',
            username: 'user',
            port: 22,
          },
        },
        favorite: {
          name: 'connection 1',
        },
      };

      const originalConnectionInfoStr = JSON.stringify(originalConnectionInfo);

      const newConnectionInfo = mergeSecrets(originalConnectionInfo, {
        password: 'xxx',
        awsSessionToken: 'xxx',
        sshTunnelPassphrase: 'xxx',
        tlsCertificateKeyFilePassword: 'xxx',
        proxyPassword: 'xxx',
      });

      expect(newConnectionInfo).to.not.equal(originalConnectionInfo);

      expect(newConnectionInfo.connectionOptions).to.not.equal(
        originalConnectionInfo.connectionOptions
      );

      expect(newConnectionInfo.connectionOptions.sshTunnel).to.not.equal(
        originalConnectionInfo.connectionOptions.sshTunnel
      );

      expect(newConnectionInfo.favorite).to.not.equal(
        originalConnectionInfo.favorite
      );

      expect(originalConnectionInfoStr).to.equal(
        JSON.stringify(originalConnectionInfo)
      );
    });

    it('merges secrets', function () {
      const originalConnectionInfo: ConnectionInfo = {
        connectionOptions: {
          connectionString:
            'mongodb://username@localhost:27017/?proxyHost=localhost&proxyUsername=foo',
          sshTunnel: {
            host: 'localhost',
            username: 'user',
            port: 22,
          },
        },
      };

      const newConnectionInfo = mergeSecrets(originalConnectionInfo, {
        awsSessionToken: 'sessionToken',
        password: 'userPassword',
        sshTunnelPassword: 'password',
        sshTunnelPassphrase: 'passphrase',
        tlsCertificateKeyFilePassword: 'tlsCertPassword',
        proxyPassword: 'bar',
      });

      expect(newConnectionInfo).to.be.deep.equal({
        connectionOptions: {
          connectionString:
            'mongodb://username:userPassword@localhost:27017/?' +
            'proxyHost=localhost&proxyUsername=foo&' +
            'tlsCertificateKeyFilePassword=tlsCertPassword&' +
            'proxyPassword=bar&' +
            'authMechanismProperties=AWS_SESSION_TOKEN%3AsessionToken',
          sshTunnel: {
            host: 'localhost',
            username: 'user',
            password: 'password',
            port: 22,
            identityKeyPassphrase: 'passphrase',
          },
        },
      } as ConnectionInfo);
    });
  });

  describe('extractSecrets', function () {
    it('does not modify the original object', function () {
      const originalConnectionInfo: ConnectionInfo = {
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017',
          sshTunnel: {
            host: 'localhost',
            username: 'user',
            port: 22,
          },
        },
        favorite: {
          name: 'connection 1',
        },
      };

      const originalConnectionInfoStr = JSON.stringify(originalConnectionInfo);

      const { connectionInfo: newConnectionInfo } = extractSecrets(
        originalConnectionInfo
      );

      expect(newConnectionInfo).to.not.equal(originalConnectionInfo);

      expect(newConnectionInfo.connectionOptions).to.not.equal(
        originalConnectionInfo.connectionOptions
      );

      expect(newConnectionInfo.connectionOptions.sshTunnel).to.not.equal(
        originalConnectionInfo.connectionOptions.sshTunnel
      );

      expect(newConnectionInfo.favorite).to.not.equal(
        originalConnectionInfo.favorite
      );

      expect(originalConnectionInfoStr).to.equal(
        JSON.stringify(originalConnectionInfo)
      );
    });

    it('extracts secrets', function () {
      const originalConnectionInfo: ConnectionInfo = {
        connectionOptions: {
          connectionString:
            'mongodb://username:userPassword@localhost:27017/?' +
            'tlsCertificateKeyFilePassword=tlsCertPassword&' +
            'authMechanismProperties=AWS_SESSION_TOKEN%3AsessionToken&' +
            'proxyHost=localhost&proxyUsername=foo&proxyPassword=bar',
          sshTunnel: {
            host: 'localhost',
            username: 'user',
            password: 'password',
            port: 22,
            identityKeyPassphrase: 'passphrase',
          },
        },
      };

      const { connectionInfo: newConnectionInfo, secrets } = extractSecrets(
        originalConnectionInfo
      );

      expect(newConnectionInfo).to.be.deep.equal({
        connectionOptions: {
          connectionString:
            'mongodb://username@localhost:27017/?proxyHost=localhost&proxyUsername=foo',
          sshTunnel: {
            host: 'localhost',
            username: 'user',
            port: 22,
          },
        },
      } as ConnectionInfo);

      expect(secrets).to.be.deep.equal({
        awsSessionToken: 'sessionToken',
        password: 'userPassword',
        sshTunnelPassword: 'password',
        sshTunnelPassphrase: 'passphrase',
        tlsCertificateKeyFilePassword: 'tlsCertPassword',
        proxyPassword: 'bar',
      } as ConnectionSecrets);
    });
  });
});
