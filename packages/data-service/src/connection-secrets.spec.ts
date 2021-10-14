import { expect } from 'chai';
import { ConnectionInfo } from './connection-info';
import {
  mergeSecrets,
  extractSecrets,
  ConnectionSecrets,
} from './connection-secrets';

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
          connectionString: 'mongodb://username@localhost:27017/',
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
        sshTunnelPassphrase: 'passphrase',
      });

      expect(newConnectionInfo).to.be.deep.equal({
        connectionOptions: {
          connectionString:
            'mongodb://username:userPassword@localhost:27017/?authMechanismProperties=AWS_SESSION_TOKEN%3AsessionToken',
          sshTunnel: {
            host: 'localhost',
            username: 'user',
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
            'mongodb://username:userPassword@localhost:27017/?authMechanismProperties=AWS_SESSION_TOKEN%3AsessionToken',
          sshTunnel: {
            host: 'localhost',
            username: 'user',
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
          connectionString: 'mongodb://username@localhost:27017/',
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
        sshTunnelPassphrase: 'passphrase',
      } as ConnectionSecrets);
    });
  });
});
