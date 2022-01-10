import { expect } from 'chai';

import { validateConnectionInfoErrors } from './validation';
import { ConnectionInfo } from 'mongodb-data-service';

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
      const result = validateConnectionInfoErrors(connectionInfo);
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
      const result = validateConnectionInfoErrors(connectionInfo);
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
      const result = validateConnectionInfoErrors(connectionInfo);
      expect(result).to.deep.equal([
        {
          field: 'sshHostname',
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
      const result = validateConnectionInfoErrors(connectionInfo);
      expect(result).to.deep.equal([
        {
          message:
            'When connecting via SSH tunnel either password or identity file is required',
        },
      ]);
    });
  });

  describe('X509', function () {
    it('should return error if tls or ssl is not enabled', function () {
      const connectionInfo: ConnectionInfo = {
        id: 'connection-test',
        connectionOptions: {
          connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&tlsCertificateFile=/path/to/file.pem`,
        },
      };
      const result = validateConnectionInfoErrors(connectionInfo);
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
          connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&tls=false&tlsCertificateFile=/path/to/file.pem`,
        },
      };
      const result = validateConnectionInfoErrors(connectionInfo);
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
          connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&ssl=false&tlsCertificateFile=/path/to/file.pem`,
        },
      };
      const result = validateConnectionInfoErrors(connectionInfo);
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
          connectionString: `mongodb+srv://myserver.com?authMechanism=MONGODB-X509&tlsCertificateFile=/path/to/file.pem`,
        },
      };
      const result = validateConnectionInfoErrors(connectionInfo);
      expect(result).to.be.empty;
    });

    it('should not return error if tls is enabled', function () {
      const connectionInfo: ConnectionInfo = {
        id: 'connection-test',
        connectionOptions: {
          connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&tls=true&tlsCertificateFile=/path/to/file.pem`,
        },
      };
      const result = validateConnectionInfoErrors(connectionInfo);
      expect(result).to.be.empty;
    });

    it('should not return error if ssl is enabled', function () {
      const connectionInfo: ConnectionInfo = {
        id: 'connection-test',
        connectionOptions: {
          connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&ssl=true&tlsCertificateFile=/path/to/file.pem`,
        },
      };
      const result = validateConnectionInfoErrors(connectionInfo);
      expect(result).to.be.empty;
    });

    it('should return error if no certificate is provided', function () {
      const connectionInfo: ConnectionInfo = {
        id: 'connection-test',
        connectionOptions: {
          connectionString: `mongodb://myserver.com?authMechanism=MONGODB-X509&ssl=true`,
        },
      };
      const result = validateConnectionInfoErrors(connectionInfo);
      expect(result).to.deep.equal([
        {
          message: 'A Client Certificate is required with x509 authentication.',
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
      const result = validateConnectionInfoErrors(connectionInfo);
      expect(result).to.deep.equal([
        {
          message: 'Username and password are required.',
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
      const result = validateConnectionInfoErrors(connectionInfo);
      expect(result).to.deep.equal([
        {
          field: 'kerberosPrincipal',
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
      const result = validateConnectionInfoErrors(connectionInfo);
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
      const result = validateConnectionInfoErrors(connectionInfo);
      expect(result).to.deep.equal([
        {
          field: 'username',
          message: 'Username is missing.',
        },
        {
          field: 'password',
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
      const result = validateConnectionInfoErrors(connectionInfo);
      expect(result).to.deep.equal([
        {
          field: 'password',
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
      const result = validateConnectionInfoErrors(connectionInfo);
      expect(result).to.be.empty;
    });
  });
});
