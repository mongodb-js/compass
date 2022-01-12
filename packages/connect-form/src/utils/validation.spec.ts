import { expect } from 'chai';

import {
  errorMessageByFieldName,
  validateConnectionOptionsErrors,
  validateConnectionOptionsWarnings,
} from './validation';
import { ConnectionInfo } from 'mongodb-data-service';

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
            message: 'A hostname is required to connect with an SSH tunnel',
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
            message:
              'When connecting via SSH tunnel either password or identity file is required',
          },
        ]);
      });

      it('should return errors if SSH is configured with identity file password but no identity file', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: 'mongodb://myserver.com',
            sshTunnel: {
              host: 'my-hostname',
              port: 22,
              username: 'mongouser',
              identityKeyPassphrase: 'abc',
            },
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(
          result.filter((err) => err.fieldName === 'sshIdentityKeyFile')
        ).to.deep.equal([
          {
            fieldName: 'sshIdentityKeyFile',
            message: 'File is required along with passphrase.',
          },
        ]);
      });
    });

    describe('X509', function () {
      it('should return error if tls or ssl is not enabled', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&tlsCertificateKeyFile=/path/to/file.pem`,
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.deep.equal([
          {
            message: 'TLS must be enabled in order to use x509 authentication.',
          },
        ]);
      });
      it('should return error if tls is disabled', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&tls=false&tlsCertificateKeyFile=/path/to/file.pem`,
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.deep.equal([
          {
            message: 'TLS must be enabled in order to use x509 authentication.',
          },
        ]);
      });

      it('should return error if ssl is disabled', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&ssl=false&tlsCertificateKeyFile=/path/to/file.pem`,
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.deep.equal([
          {
            message: 'TLS must be enabled in order to use x509 authentication.',
          },
        ]);
      });
      it('should not return error if ssl/tsl is disabled and schema is mongosrv', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb+srv://myserver.com?authMechanism=MONGODB-X509&tlsCertificateKeyFile=/path/to/file.pem`,
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.be.empty;
      });

      it('should not return error if tls is enabled', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&tls=true&tlsCertificateKeyFile=/path/to/file.pem`,
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.be.empty;
      });

      it('should not return error if ssl is enabled', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&ssl=true&tlsCertificateKeyFile=/path/to/file.pem`,
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.be.empty;
      });

      it('should return error if no certificate is provided', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&ssl=true`,
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.deep.equal([
          {
            message:
              'A Client Certificate is required with x509 authentication.',
          },
        ]);
      });
    });
    describe('LDAP', function () {
      it('should return errors if no password is defined', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://username:@myserver.com?authMechanism=PLAIN`,
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.deep.equal([
          {
            fieldName: 'password',
            message: 'Password is missing.',
          },
        ]);
      });
    });
    describe('Kerberos', function () {
      it('should return errors if no principal is defined when using Kerberos', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://myserver.com?authMechanism=GSSAPI`,
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.deep.equal([
          {
            fieldName: 'kerberosPrincipal',
            message: 'Principal name is required with Kerberos.',
          },
        ]);
      });
      it('should not return errors if principal is defined when using Kerberos', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://principal@myserver.com?authMechanism=GSSAPI`,
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.be.empty;
      });
    });
    describe('SCRAM-SHA', function () {
      it('should return errors if username and password are missing', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://myserver.com?authMechanism=SCRAM-SHA-1`,
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.deep.equal([
          {
            fieldName: 'username',
            message: 'Username is missing.',
          },
          {
            fieldName: 'password',
            message: 'Password is missing.',
          },
        ]);
      });
      it('should return errors if password is missing', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://username@myserver.com?authMechanism=SCRAM-SHA-1`,
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.deep.equal([
          {
            fieldName: 'password',
            message: 'Password is missing.',
          },
        ]);
      });
      it('should not return errors if username and password are provided', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://username:password@myserver.com?authMechanism=SCRAM-SHA-1`,
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.be.empty;
      });
    });
    describe('Default Auth Method', function () {
      it('should return errors if username and password are missing', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://myserver.com`,
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.be.empty;
      });
      it('should return errors if password is missing', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://username@myserver.com`,
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
        expect(result).to.deep.equal([
          {
            fieldName: 'password',
            message: 'Password is missing.',
          },
        ]);
      });
      it('should not return errors if username and password are provided', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://username:password@myserver.com`,
          },
        };
        const result = validateConnectionOptionsErrors(
          connectionInfo.connectionOptions
        );
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
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb+srv://myserver.com?${option}=true`,
          },
        };
        const result = validateConnectionOptionsWarnings(
          connectionInfo.connectionOptions
        );
        expect(result[0]).to.deep.equal({
          message:
            'Disabling certificate validation is not recommended as it may create a security vulnerability',
        });
      });
    });

    it('should return warnings if unknown readPreference', function () {
      const connectionInfo: ConnectionInfo = {
        id: 'connection-test',
        connectionOptions: {
          connectionString: `mongodb://myserver.com?readPreference=invalidReadPreference`,
        },
      };
      const result = validateConnectionOptionsWarnings(
        connectionInfo.connectionOptions
      );
      expect(result[0]).to.deep.equal({
        message: 'Unknown read preference invalidReadPreference',
      });
    });

    it('should return warnings if tlsCertificateFile is set', function () {
      const connectionInfo: ConnectionInfo = {
        id: 'connection-test',
        connectionOptions: {
          connectionString: `mongodb://myserver.com?tlsCertificateFile=/path/to/file.pem`,
        },
      };
      const result = validateConnectionOptionsWarnings(
        connectionInfo.connectionOptions
      );
      expect(result[0]).to.deep.equal({
        message:
          'tlsCertificateFile is deprecated and will be removed in future versions of Compass, please embed the client key and certificate chain in a single .pem bundle and use tlsCertificateKeyFile instead.',
      });
    });

    describe('Kerberos', function () {
      it('should return warning if password is set', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://user:password@myserver.com?tls=true&authMechanism=GSSAPI`,
          },
        };
        const result = validateConnectionOptionsWarnings(
          connectionInfo.connectionOptions
        );
        expect(result).to.deep.equal([
          {
            message: 'The password is ignored with Kerberos.',
          },
        ]);
      });
    });
    describe('directConnection', function () {
      it('should return warning if mongo+srv and directConnection=true', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb+srv://myserver.com?tls=true&directConnection=true`,
          },
        };
        const result = validateConnectionOptionsWarnings(
          connectionInfo.connectionOptions
        );
        expect(result).to.deep.equal([
          {
            message: 'directConnection not supported with SRV URI.',
          },
        ]);
      });

      it('should not return warnings if mongo+srv and directConnection=false', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb+srv://myserver.com?tls=true&directConnection=false`,
          },
        };
        const result = validateConnectionOptionsWarnings(
          connectionInfo.connectionOptions
        );
        expect(result).to.be.empty;
      });
      it('should not return warnings if mongo+srv and directConnection is not defined', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb+srv://myserver.com?tls=true`,
          },
        };
        const result = validateConnectionOptionsWarnings(
          connectionInfo.connectionOptions
        );
        expect(result).to.be.empty;
      });

      it('should return warning if replicaSet and directConnection=true', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://myserver.com?tls=true&directConnection=true&replicaSet=myReplicaSet`,
          },
        };
        const result = validateConnectionOptionsWarnings(
          connectionInfo.connectionOptions
        );
        expect(result).to.deep.equal([
          {
            message: 'directConnection is not supported with replicaSet.',
          },
        ]);
      });

      it('should return warning if multiple hosts and directConnection=true', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: `mongodb://myserver.com,myserver2.com?tls=true&directConnection=true`,
          },
        };
        const result = validateConnectionOptionsWarnings(
          connectionInfo.connectionOptions
        );
        expect(result).to.deep.equal([
          {
            message: 'directConnection is not supported with multiple hosts.',
          },
        ]);
      });
    });

    describe('TLS', function () {
      it('should not return warning if TLS is disabled and mongo+srv', function () {
        const connectionInfo: ConnectionInfo = {
          id: 'connection-test',
          connectionOptions: {
            connectionString: 'mongodb+srv://myserver.com&tls=false',
          },
        };
        const result = validateConnectionOptionsWarnings(
          connectionInfo.connectionOptions
        );
        expect(result).to.be.empty;
      });
    });

    it('should return warning if TLS is disabled and is not localhost', function () {
      const connectionInfo: ConnectionInfo = {
        id: 'connection-test',
        connectionOptions: {
          connectionString: 'mongodb://myserver.com',
        },
      };
      const result = validateConnectionOptionsWarnings(
        connectionInfo.connectionOptions
      );
      expect(result).to.deep.equal([
        {
          message:
            'Connecting without tls is not recommended as it may create a security vulnerability.',
        },
      ]);
    });
  });
});
