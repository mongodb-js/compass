import { expect } from 'chai';
import util from 'util';

import { ConnectionInfo } from '../connection-info';

import {
  convertConnectionInfoToModel,
  convertConnectionModelToInfo,
  LegacyConnectionModelProperties,
} from './legacy-connection-model';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ConnectionModel = require('mongodb-connection-model');

async function createAndConvertModel(
  connectionString: string,
  additionalOptions?: Partial<LegacyConnectionModelProperties>
): Promise<ConnectionInfo> {
  const model = await util.promisify(ConnectionModel.from)(connectionString);
  Object.assign(model, additionalOptions ?? {});
  return convertConnectionModelToInfo(model);
}

describe.only('LegacyConnectionModel', function () {
  describe('convertConnectionModelToInfo', function () {
    it('converts _id', async function () {
      const { id } = await createAndConvertModel(
        'mongodb://localhost:27017/admin',
        { _id: '1234-1234-1234-1234' }
      );

      expect(id).to.deep.equal('1234-1234-1234-1234');
    });

    it('converts favorite', async function () {
      const { favorite } = await createAndConvertModel(
        'mongodb://localhost:27017/admin',
        {
          _id: '1234-1234-1234-1234',
          isFavorite: true,
          name: 'Connection 1',
          color: '#00000',
        }
      );

      expect(favorite).to.deep.equal({
        name: 'Connection 1',
        color: '#00000',
      });
    });

    it('converts lastUsed', async function () {
      const lastUsed = new Date();

      const { lastUsed: convertedLastUsed } = await createAndConvertModel(
        'mongodb://localhost:27017/admin',
        {
          _id: '1234-1234-1234-1234',
          lastUsed,
        }
      );

      expect(convertedLastUsed).to.deep.equal(lastUsed);
    });

    it('converts anon local string', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://localhost:27017/admin',
        { _id: '1234-1234-1234-1234' }
      );

      expect(connectionOptions).to.deep.equal({
        connectionString:
          'mongodb://localhost:27017/admin?readPreference=primary&directConnection=true&ssl=false',
      });
    });

    it('converts username and password', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://user:password@localhost/admin',
        { _id: '1234-1234-1234-1234' }
      );

      expect(connectionOptions).to.deep.equal({
        connectionString:
          'mongodb://user:password@localhost:27017/admin?authSource=admin&readPreference=primary&directConnection=true&ssl=false',
      });
    });

    it('converts SSL true', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://user:password@localhost/admin?ssl=true',
        { _id: '1234-1234-1234-1234' }
      );

      expect(connectionOptions).to.deep.equal({
        connectionString:
          'mongodb://user:password@localhost:27017/admin?authSource=admin&readPreference=primary&directConnection=true&ssl=true',
      });
    });

    it('converts sslMethod ALL', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://user:password@localhost/admin?ssl=true',
        {
          _id: '1234-1234-1234-1234',
          sslMethod: 'ALL',
          ssl: true,
          sslCA: ['pathToCaFile'],
          sslCert: 'pathToCertKey',
          sslKey: 'pathToCertKey',
        }
      );

      expect(connectionOptions).to.deep.equal({
        connectionString:
          'mongodb://user:password@localhost:27017/admin?' +
          'authSource=admin&readPreference=primary&directConnection=true' +
          '&ssl=true' +
          '&tlsCAFile=pathToCaFile' +
          '&tlsCertificateKeyFile=pathToCertKey',
      });
    });

    it('stores sslCert as tlsCertificateFile if different from sslKey', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://user:password@localhost/admin?ssl=true',
        {
          _id: '1234-1234-1234-1234',
          sslMethod: 'ALL',
          ssl: true,
          sslCA: ['pathToCaFile'],
          sslCert: 'pathToCertKey1',
          sslKey: 'pathToCertKey2',
        }
      );

      expect(connectionOptions).to.deep.equal({
        connectionString:
          'mongodb://user:password@localhost:27017/admin?' +
          'authSource=admin&readPreference=primary&directConnection=true' +
          '&ssl=true' +
          '&tlsCAFile=pathToCaFile' +
          '&tlsCertificateKeyFile=pathToCertKey2',
        tlsCertificateFile: 'pathToCertKey1',
      });
    });

    it('converts X509', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://localhost:27017?&socketTimeoutMS=2000',
        {
          _id: '1234-1234-1234-1234',
          sslMethod: 'ALL',
          ssl: true,
          sslCA: ['pathToCaFile'],
          sslCert: 'pathToCertKey1',
          sslKey: 'pathToCertKey2',
          authStrategy: 'X509',
        }
      );

      expect(connectionOptions).to.deep.equal({
        connectionString:
          'mongodb://localhost:27017/?authMechanism=MONGODB-X509' +
          '&socketTimeoutMS=2000' +
          '&readPreference=primary' +
          '&directConnection=true' +
          '&ssl=true' +
          '&authSource=%24external' +
          '&tlsAllowInvalidCertificates=true' +
          '&tlsAllowInvalidHostnames=true' +
          '&tlsCAFile=pathToCaFile' +
          '&tlsCertificateKeyFile=pathToCertKey2',
        tlsCertificateFile: 'pathToCertKey1',
      });
    });

    it('converts extra options', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://localhost:27017?&socketTimeoutMS=2000'
      );

      expect(connectionOptions).to.deep.equal({
        connectionString:
          'mongodb://localhost:27017/' +
          '?socketTimeoutMS=2000&readPreference=primary&directConnection=true&ssl=false',
      });
    });

    it('keeps SRV url intact', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb+srv://compass-data-sets.e06dc.mongodb.net'
      );

      expect(connectionOptions).to.deep.equal({
        connectionString:
          'mongodb+srv://compass-data-sets.e06dc.mongodb.net/' +
          '?replicaSet=compass-data-sets-shard-0&readPreference=primary&authSource=admin&ssl=true',
      });
    });

    it('converts ssh tunnel options (USER_PASSWORD)', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://localhost:27017',
        {
          sshTunnel: 'USER_PASSWORD',
          sshTunnelHostname: 'jumphost',
          sshTunnelPort: 22,
          sshTunnelUsername: 'root',
        }
      );

      expect(connectionOptions).to.deep.equal({
        connectionString:
          'mongodb://localhost:27017/' +
          '?readPreference=primary&directConnection=true&ssl=false',
        sshTunnel: {
          host: 'jumphost',
          port: 22,
          username: 'root',
        },
      });
    });

    it('converts ssh tunnel options (IDENTITY_FILE)', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://localhost:27017',
        {
          sshTunnel: 'IDENTITY_FILE',
          sshTunnelHostname: 'jumphost',
          sshTunnelPort: 22,
          sshTunnelUsername: 'root',
          sshTunnelIdentityFile: 'myfile',
        }
      );

      expect(connectionOptions).to.deep.equal({
        connectionString:
          'mongodb://localhost:27017/' +
          '?readPreference=primary&directConnection=true&ssl=false',
        sshTunnel: {
          host: 'jumphost',
          port: 22,
          identityKeyFile: 'myfile',
          username: 'root',
        },
      });
    });

    it('converts ssh tunnel options (IDENTITY_FILE) + passphrase', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://localhost:27017',
        {
          sshTunnel: 'IDENTITY_FILE',
          sshTunnelHostname: 'jumphost',
          sshTunnelPort: 22,
          sshTunnelUsername: 'root',
          sshTunnelIdentityFile: 'myfile',
          sshTunnelPassphrase: 'passphrase',
        }
      );

      expect(connectionOptions).to.deep.equal({
        connectionString:
          'mongodb://localhost:27017/' +
          '?readPreference=primary&directConnection=true&ssl=false',
        sshTunnel: {
          host: 'jumphost',
          port: 22,
          identityKeyFile: 'myfile',
          identityKeyPassphrase: 'passphrase',
          username: 'root',
        },
      });
    });
  });

  it('converts ssh tunnel options (IDENTITY_FILE array)', async function () {
    const { connectionOptions } = await createAndConvertModel(
      'mongodb://localhost:27017',
      {
        sshTunnel: 'IDENTITY_FILE',
        sshTunnelHostname: 'jumphost',
        sshTunnelPort: 22,
        sshTunnelUsername: 'root',
        sshTunnelIdentityFile: ['myfile'],
      }
    );

    expect(connectionOptions).to.deep.equal({
      connectionString:
        'mongodb://localhost:27017/' +
        '?readPreference=primary&directConnection=true&ssl=false',
      sshTunnel: {
        host: 'jumphost',
        port: 22,
        identityKeyFile: 'myfile',
        username: 'root',
      },
    });
  });

  it('converts ssh tunnel options (IDENTITY_FILE) + passphrase', async function () {
    const { connectionOptions } = await createAndConvertModel(
      'mongodb://localhost:27017',
      {
        sshTunnel: 'IDENTITY_FILE',
        sshTunnelHostname: 'jumphost',
        sshTunnelPort: 22,
        sshTunnelUsername: 'root',
        sshTunnelIdentityFile: 'myfile',
        sshTunnelPassphrase: 'passphrase',
      }
    );

    expect(connectionOptions).to.deep.equal({
      connectionString:
        'mongodb://localhost:27017/' +
        '?readPreference=primary&directConnection=true&ssl=false',
      sshTunnel: {
        host: 'jumphost',
        port: 22,
        identityKeyFile: 'myfile',
        identityKeyPassphrase: 'passphrase',
        username: 'root',
      },
    });
  });

  describe('convertConnectionInfoToModel', function () {
    it('stores connectionInfo and secrets', async function () {
      const connectionInfo = {
        connectionOptions: {
          connectionString: 'mongodb://user:password@localhost:27017',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.connectionInfo).to.deep.equal({
        connectionOptions: {
          connectionString: 'mongodb://user@localhost:27017/',
        },
      });

      expect(connectionModel.secrets).to.deep.equal({
        password: 'password',
      });
    });

    it('converts favorite and history properties', async function () {
      const lastUsed = new Date();
      const connectionInfo: ConnectionInfo = {
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017',
        },
        lastUsed,
        favorite: {
          name: 'Local',
          color: 'blue',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.isFavorite).to.equal(true);
      expect(connectionModel.color).to.equal('blue');
      expect(connectionModel.name).to.equal('Local');
      expect(connectionModel.lastUsed).to.deep.equal(lastUsed);
    });

    it('converts no auth', async function () {
      const connectionInfo: ConnectionInfo = {
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.authStrategy).to.equal('NONE');
      expect(connectionModel.hostname).to.equal('localhost');
      expect(connectionModel.port).to.equal(27017);
      expect(connectionModel.mongodbUsername).to.be.undefined;
      expect(connectionModel.mongodbPassword).to.be.undefined;
    });

    it('converts authSource', async function () {
      const connectionInfo = {
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017/test123?authSource=db1',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.ns).to.equal('test123');
      expect(connectionModel.authSource).to.equal('db1');
    });

    it('converts replicaSet', async function () {
      const connectionInfo = {
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017/?replicaSet=rs1',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.replicaSet).to.equal('rs1');
    });

    it('converts username and password', async function () {
      const connectionInfo = {
        connectionOptions: {
          connectionString: 'mongodb://user:password@localhost:27017',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.authStrategy).to.equal('MONGODB');
      expect(connectionModel.hostname).to.equal('localhost');
      expect(connectionModel.port).to.equal(27017);
      expect(connectionModel.mongodbUsername).to.equal('user');
      expect(connectionModel.mongodbPassword).to.equal('password');
    });

    it('converts kerberos', async function () {
      const connectionInfo = {
        connectionOptions: {
          connectionString:
            'mongodb://mongodb.user%40EXAMPLE.COM@mongodb-kerberos-1.example.com:29017/?authMechanism=GSSAPI',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.authMechanism).to.equal('GSSAPI');
      expect(connectionModel.hostname).to.equal(
        'mongodb-kerberos-1.example.com'
      );
      expect(connectionModel.port).to.equal(29017);
      expect(connectionModel.mongodbUsername).to.be.undefined;
      expect(connectionModel.mongodbPassword).to.be.undefined;
      expect(connectionModel.kerberosPrincipal).to.equal(
        'mongodb.user@EXAMPLE.COM'
      );
      expect(connectionModel.kerberosServiceName).to.be.undefined;
      expect(connectionModel.kerberosCanonicalizeHostname).to.equal(false);
    });

    it('converts kerberos (alternate service name)', async function () {
      const connectionInfo = {
        connectionOptions: {
          connectionString:
            'mongodb://mongodb.user%40EXAMPLE.COM@mongodb-kerberos-2.example.com:29018/?authMechanism=GSSAPI&authMechanismProperties=SERVICE_NAME%3Aalternate',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.authMechanism).to.equal('GSSAPI');
      expect(connectionModel.hostname).to.equal(
        'mongodb-kerberos-2.example.com'
      );
      expect(connectionModel.port).to.equal(29018);
      expect(connectionModel.mongodbUsername).to.be.undefined;
      expect(connectionModel.mongodbPassword).to.be.undefined;
      expect(connectionModel.kerberosPrincipal).to.equal(
        'mongodb.user@EXAMPLE.COM'
      );
      expect(connectionModel.kerberosServiceName).to.equal('alternate');
      expect(connectionModel.kerberosCanonicalizeHostname).to.equal(false);
    });

    it('converts kerberos (canonicalize hostname)', async function () {
      const connectionInfo = {
        connectionOptions: {
          connectionString:
            'mongodb://mongodb.user%40EXAMPLE.COM@mongodb-kerberos-2.example.com:29018/?authMechanism=GSSAPI&authMechanismProperties=CANONICALIZE_HOST_NAME%3Atrue',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.authMechanism).to.equal('GSSAPI');
      expect(connectionModel.hostname).to.equal(
        'mongodb-kerberos-2.example.com'
      );
      expect(connectionModel.port).to.equal(29018);
      expect(connectionModel.mongodbUsername).to.be.undefined;
      expect(connectionModel.mongodbPassword).to.be.undefined;
      expect(connectionModel.kerberosPrincipal).to.equal(
        'mongodb.user@EXAMPLE.COM'
      );
      expect(connectionModel.kerberosServiceName).to.be.undefined;
      expect(connectionModel.kerberosCanonicalizeHostname).to.equal(true);
    });
  });
});
