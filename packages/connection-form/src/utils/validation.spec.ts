import { expect } from 'chai';

import {
  validateConnectionOptionsErrors,
  validateConnectionOptionsWarnings,
} from './validation';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';

describe('validation', function () {
  describe('Form Validation Errors', function () {
    describe('SSH', function () {
      it('should not return error if schema is mongodb and SSH is configured', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: 'mongodb://myserver.com',
            sshTunnel: {
              host: 'my-host',
              port: 22,
              username: 'mongouser',
              password: 'password',
            },
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.be.empty;
      });

      it('should not return error SSH is configured with identity file', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: 'mongodb://myserver.com',
            sshTunnel: {
              host: 'my-host',
              port: 22,
              username: 'mongouser',
              identityKeyFile: '/path/to/file.pem',
            },
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.be.empty;
      });

      it('should return errors if SSH is configured without hostname', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: 'mongodb://myserver.com,myserver2.com',
            sshTunnel: {
              host: '',
              port: 22,
              username: 'mongouser',
              password: 'password',
            },
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.deep.equal([
          {
            fieldName: 'sshHostname',
            fieldTab: 'proxy',
            message: 'A hostname is required to connect with an SSH tunnel.',
          },
        ]);
      });

      it('should return errors if SSH is configured without both password and identity file', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: 'mongodb://myserver.com',
            sshTunnel: {
              host: 'my-hostname',
              port: 22,
              username: 'mongouser',
            },
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.deep.equal([
          {
            fieldName: 'sshPassword',
            fieldTab: 'proxy',
            message:
              'When connecting via SSH tunnel either password or identity file is required.',
          },
        ]);
      });

      it('should return errors if SSH is configured with identity file password but no identity file', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: 'mongodb://myserver.com',
          sshTunnel: {
            host: 'my-hostname',
            port: 22,
            username: 'mongouser',
            identityKeyPassphrase: 'abc',
          },
        });
        expect(
          result.filter((err) => err.fieldName === 'sshIdentityKeyFile')
        ).to.deep.equal([
          {
            fieldName: 'sshIdentityKeyFile',
            fieldTab: 'proxy',
            message: 'File is required along with passphrase.',
          },
        ]);
      });

      it('should not return errors if SSH is not configured and proxyHost is not set', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: 'mongodb://myserver.com/',
        });
        expect(result).to.deep.equal([]);
      });

      it('should not return errors if SSH is not set but proxyHost is set', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: 'mongodb://myserver.com/?proxyHost=hello',
          sshTunnel: undefined,
        });
        expect(result).to.deep.equal([]);
      });

      it('should not return errors if SSH is set but proxyHost is not set', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: 'mongodb://myserver.com/',
          sshTunnel: {
            host: 'hello-world.com',
            port: 22,
            username: 'cosmo',
            password: 'kramer',
          },
        });
        expect(result).to.deep.equal([]);
      });

      it('should return errors if proxyHost is missing from proxy options', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: 'mongodb://myserver.com/?proxyUsername=hello',
          sshTunnel: undefined,
        });
        expect(result).to.deep.equal([
          {
            fieldName: 'proxyHostname',
            fieldTab: 'proxy',
            message: 'Proxy hostname is required.',
          },
        ]);
      });
    });

    describe('X509', function () {
      it('should return error if tls or ssl is not enabled', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&tlsCertificateKeyFile=/path/to/file.pem`,
        });
        expect(result).to.deep.equal([
          {
            fieldName: 'tls',
            fieldTab: 'tls',
            message: 'TLS must be enabled in order to use x509 authentication.',
          },
        ]);
      });
      it('should return error if tls is disabled', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&tls=false&tlsCertificateKeyFile=/path/to/file.pem`,
        });
        expect(result).to.deep.equal([
          {
            fieldName: 'tls',
            fieldTab: 'tls',
            message: 'TLS must be enabled in order to use x509 authentication.',
          },
        ]);
      });

      it('should return error if ssl is disabled', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&ssl=false&tlsCertificateKeyFile=/path/to/file.pem`,
        });
        expect(result).to.deep.equal([
          {
            fieldTab: 'tls',
            fieldName: 'tls',
            message: 'TLS must be enabled in order to use x509 authentication.',
          },
        ]);
      });
      it('should not return error if ssl/tsl is disabled and schema is mongosrv', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: `mongodb+srv://myserver.com?authMechanism=MONGODB-X509&tlsCertificateKeyFile=/path/to/file.pem`,
        });
        expect(result).to.be.empty;
      });

      it('should not return error if tls is enabled', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&tls=true&tlsCertificateKeyFile=/path/to/file.pem`,
        });
        expect(result).to.be.empty;
      });

      it('should not return error if ssl is enabled', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&ssl=true&tlsCertificateKeyFile=/path/to/file.pem`,
        });
        expect(result).to.be.empty;
      });

      it('should return error if no certificate is provided', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&ssl=true`,
        });
        expect(result).to.deep.equal([
          {
            fieldTab: 'tls',
            fieldName: 'tlsCertificateKeyFile',
            message:
              'A Client Certificate is required with x509 authentication.',
          },
        ]);
      });
    });
    describe('LDAP', function () {
      it('should return errors if no password is defined', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: `mongodb://username:@myserver.com?authMechanism=PLAIN`,
        });
        expect(result).to.deep.equal([
          {
            fieldName: 'password',
            fieldTab: 'authentication',
            message: 'Password is missing.',
          },
        ]);
      });
    });
    describe('Kerberos', function () {
      it('should return errors if no principal is defined when using Kerberos', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: `mongodb://myserver.com?authMechanism=GSSAPI`,
        });
        expect(result).to.deep.equal([
          {
            fieldName: 'kerberosPrincipal',
            fieldTab: 'authentication',
            message: 'Principal name is required with Kerberos.',
          },
        ]);
      });
      it('should not return errors if principal is defined when using Kerberos', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: `mongodb://principal@myserver.com?authMechanism=GSSAPI`,
        });
        expect(result).to.be.empty;
      });
    });
    describe('SCRAM-SHA', function () {
      it('should return errors if username and password are missing', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: `mongodb://myserver.com?authMechanism=SCRAM-SHA-1`,
        });
        expect(result).to.deep.equal([
          {
            fieldName: 'username',
            fieldTab: 'authentication',
            message: 'Username is missing.',
          },
          {
            fieldName: 'password',
            fieldTab: 'authentication',
            message: 'Password is missing.',
          },
        ]);
      });
      it('should return errors if password is missing', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: `mongodb://username@myserver.com?authMechanism=SCRAM-SHA-1`,
        });
        expect(result).to.deep.equal([
          {
            fieldName: 'password',
            fieldTab: 'authentication',
            message: 'Password is missing.',
          },
        ]);
      });
      it('should not return errors if username and password are provided', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: `mongodb://username:password@myserver.com?authMechanism=SCRAM-SHA-1`,
        });
        expect(result).to.be.empty;
      });
    });
    describe('Default Auth Method', function () {
      it('should return errors if username and password are missing', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: `mongodb://myserver.com`,
        });
        expect(result).to.be.empty;
      });
      it('should return errors if password is missing', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: `mongodb://username@myserver.com`,
        });
        expect(result).to.deep.equal([
          {
            fieldName: 'password',
            fieldTab: 'authentication',
            message: 'Password is missing.',
          },
        ]);
      });
      it('should not return errors if username and password are provided', function () {
        const result = validateConnectionOptionsErrors({
          connectionString: `mongodb://username:password@myserver.com`,
        });
        expect(result).to.be.empty;
      });
    });
  });

  describe('Form Validation Warnings', function () {
    it('should return warnings when disabling certificate validation', function () {
      [
        'tlsInsecure',
        'tlsAllowInvalidHostnames',
        'tlsAllowInvalidCertificates',
      ].forEach((option) => {
        const result = validateConnectionOptionsWarnings({
          connectionString: `mongodb+srv://myserver.com?${option}=true`,
        });
        expect(result[0]).to.deep.equal({
          message:
            'TLS/SSL certificate validation is disabled. If possible, enable certificate validation to avoid security vulnerabilities.',
        });
      });
    });

    it('should not return warnings when certificate validation is enabled', function () {
      [
        'tlsInsecure',
        'tlsAllowInvalidHostnames',
        'tlsAllowInvalidCertificates',
      ].forEach((option) => {
        const result = validateConnectionOptionsWarnings({
          connectionString: `mongodb+srv://myserver.com?${option}=false`,
        });
        expect(result).to.deep.equal([]);
      });
    });

    it('should return warnings if unknown readPreference', function () {
      const result = validateConnectionOptionsWarnings({
        connectionString: `mongodb://myserver.com?readPreference=invalidReadPreference`,
      });
      expect(result[0]).to.deep.equal({
        message: 'Unknown read preference invalidReadPreference',
      });
    });

    describe('directConnection', function () {
      it('should return warning if mongo+srv and directConnection=true', function () {
        const result = validateConnectionOptionsWarnings({
          connectionString: `mongodb+srv://myserver.com?tls=true&directConnection=true`,
        });
        expect(result).to.deep.equal([
          {
            message: 'directConnection not supported with SRV URI.',
          },
        ]);
      });

      it('should not return warnings if mongo+srv and directConnection=false', function () {
        const result = validateConnectionOptionsWarnings({
          connectionString: `mongodb+srv://myserver.com?tls=true&directConnection=false`,
        });
        expect(result).to.be.empty;
      });
      it('should not return warnings if mongo+srv and directConnection is not defined', function () {
        const result = validateConnectionOptionsWarnings({
          connectionString: `mongodb+srv://myserver.com?tls=true`,
        });
        expect(result).to.be.empty;
      });

      it('should return warning if replicaSet and directConnection=true', function () {
        const result = validateConnectionOptionsWarnings({
          connectionString: `mongodb://myserver.com?tls=true&directConnection=true&replicaSet=myReplicaSet`,
        });
        expect(result).to.deep.equal([
          {
            message: 'directConnection is not supported with replicaSet.',
          },
        ]);
      });

      it('should return warning if multiple hosts and directConnection=true', function () {
        const result = validateConnectionOptionsWarnings({
          connectionString: `mongodb://myserver.com,myserver2.com?tls=true&directConnection=true`,
        });
        expect(result).to.deep.equal([
          {
            message: 'directConnection is not supported with multiple hosts.',
          },
        ]);
      });
    });

    describe('TLS', function () {
      it('should not return warning if TLS is disabled and mongo+srv', function () {
        const result = validateConnectionOptionsWarnings({
          connectionString: 'mongodb+srv://myserver.com&tls=false',
        });
        expect(result).to.be.empty;
      });
    });

    it('should return warning if TLS is disabled and is not localhost', function () {
      for (const host of [
        'myserver',
        'myserver:27017',
        'myserver:27017,localhost:27018',
      ]) {
        const result = validateConnectionOptionsWarnings({
          connectionString: `mongodb://${host}`,
        });
        expect(result).to.deep.equal([
          {
            message:
              'TLS/SSL is disabled. If possible, enable TLS/SSL to avoid security vulnerabilities.',
          },
        ]);
      }
    });

    it('should not return warning if TLS is disabled and is localhost', function () {
      for (const host of [
        'localhost',
        'localhost:27017',
        'localhost:27017,localhost:27018',
        '127.0.0.1',
        '127.0.0.1:27017',
        '127.0.0.1:27017,127.0.0.1:27018',
        '0.0.0.0',
        '0.0.0.0:27017',
        '0.0.0.0:27017,0.0.0.0:27018',
        'localhost:27017,127.0.0.1:27018,0.0.0.0:27019',
      ]) {
        const result = validateConnectionOptionsWarnings({
          connectionString: `mongodb://${host}`,
        });
        expect(result, `${host} fails validation`).to.deep.equal([]);
      }
    });

    describe('Socks', function () {
      it('should not return warning if proxyHost is not set', function () {
        const result = validateConnectionOptionsWarnings({
          connectionString: 'mongodb://myserver.com/?tls=true&proxyHost=',
        });
        expect(result).to.be.empty;
      });
      it('should not return warning if proxyHost is localhost', function () {
        const result = validateConnectionOptionsWarnings({
          connectionString:
            'mongodb://myserver.com/?tls=true&proxyHost=localhost',
        });
        expect(result).to.be.empty;
      });
      it('should return warning if proxyHost is not localhost and proxyPassword is set', function () {
        const result = validateConnectionOptionsWarnings({
          connectionString:
            'mongodb://myserver.com/?tls=true&proxyHost=mongo&proxyPassword=as',
        });
        expect(result).to.deep.equal([
          {
            message: 'Socks5 proxy password will be transmitted in plaintext.',
          },
        ]);
      });
      it('should return warning if proxyHost is not localhost and hosts contains mongodb service host', function () {
        const result = validateConnectionOptionsWarnings({
          connectionString:
            'mongodb://localhost:27017/?tls=true&proxyHost=mongo',
        });
        expect(result).to.deep.equal([
          {
            message: 'Using remote proxy with local MongoDB service host.',
          },
        ]);
      });
    });
  });
});
