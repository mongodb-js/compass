import { expect } from 'chai';
import { ConnectionInfo } from 'mongodb-data-service';
import { validateConnectionInfoWarnings } from './validation-warnings';

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
      const result = validateConnectionInfoWarnings(connectionInfo);
      expect(result[0]).to.deep.equal({
        message:
          'Disabling certificate validation is not recommended as it may create a security vulnerability',
      });
    });
  });
  it('should return warnings if unknown authMechanism', function () {
    const connectionInfo: ConnectionInfo = {
      id: 'connection-test',
      connectionOptions: {
        connectionString: `mongodb://myserver.com?authMechanism=fakeAuth`,
      },
    };
    const result = validateConnectionInfoWarnings(connectionInfo);
    expect(result[0]).to.deep.equal({
      message: 'Unknown authentication mechanism fakeAuth',
    });
  });

  it('should return warnings if unknown readPreference', function () {
    const connectionInfo: ConnectionInfo = {
      id: 'connection-test',
      connectionOptions: {
        connectionString: `mongodb://myserver.com?readPreference=invalidReadPreference`,
      },
    };
    const result = validateConnectionInfoWarnings(connectionInfo);
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
    const result = validateConnectionInfoWarnings(connectionInfo);
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
      const result = validateConnectionInfoWarnings(connectionInfo);
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
      const result = validateConnectionInfoWarnings(connectionInfo);
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
      const result = validateConnectionInfoWarnings(connectionInfo);
      expect(result).to.be.empty;
    });
    it('should not return warnings if mongo+srv and directConnection is not defined', function () {
      const connectionInfo: ConnectionInfo = {
        id: 'connection-test',
        connectionOptions: {
          connectionString: `mongodb+srv://myserver.com?tls=true`,
        },
      };
      const result = validateConnectionInfoWarnings(connectionInfo);
      expect(result).to.be.empty;
    });

    it('should return warning if replicaSet and directConnection=true', function () {
      const connectionInfo: ConnectionInfo = {
        id: 'connection-test',
        connectionOptions: {
          connectionString: `mongodb://myserver.com?tls=true&directConnection=true&replicaSet=myReplicaSet`,
        },
      };
      const result = validateConnectionInfoWarnings(connectionInfo);
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
      const result = validateConnectionInfoWarnings(connectionInfo);
      expect(result).to.deep.equal([
        {
          message: 'directConnection is not supported with multiple hosts.',
        },
      ]);
    });
  });

  describe('SSH', function () {
    it('should return warning if SSH and no directConnection', function () {
      const connectionInfo: ConnectionInfo = {
        id: 'connection-test',
        connectionOptions: {
          connectionString: 'mongodb+srv://myserver.com?tls=true',
          sshTunnel: {
            host: 'my-host',
            port: 22,
            username: 'mongouser',
            password: 'password',
          },
        },
      };
      const result = validateConnectionInfoWarnings(connectionInfo);
      expect(result).to.deep.equal([
        {
          message:
            'directConnection is recommended when connecting through SSH tunnel.',
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
      const result = validateConnectionInfoWarnings(connectionInfo);
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
    const result = validateConnectionInfoWarnings(connectionInfo);
    expect(result).to.deep.equal([
      {
        message:
          'Connecting without tls is not recommended as it may create a security vulnerability.',
      },
    ]);
  });
});
