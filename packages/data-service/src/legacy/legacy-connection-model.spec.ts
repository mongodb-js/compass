import { expect } from 'chai';
import ConnectionString from 'mongodb-connection-string-url';
import util from 'util';

import type { ConnectionInfo } from '../connection-info';

import type { LegacyConnectionModelProperties } from './legacy-connection-model';
import {
  convertConnectionInfoToModel,
  convertConnectionModelToInfo,
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

describe('LegacyConnectionModel', function () {
  describe('convertConnectionModelToInfo', function () {
    it('converts a raw model to connection info', function () {
      const rawModel = {
        _id: '1234-1234-1234-1234',
        hostname: 'localhost',
        port: 27018,
        authStrategy: 'NONE',
        readPreference: 'primary',
        sslMethod: 'ALL',
        sshTunnelPort: 22,
      };
      const { id } = convertConnectionModelToInfo(rawModel);

      expect(id).to.deep.equal('1234-1234-1234-1234');
    });

    it('add directConnection=true if is a single one host', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://localhost:27017/admin',
        { _id: '1234-1234-1234-1234' }
      );

      expect(
        new ConnectionString(
          connectionOptions.connectionString
        ).searchParams.get('directConnection')
      ).to.equal('true');
    });

    it('does not alter directConnection=true', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://localhost:27017/admin?directConnection=true',
        { _id: '1234-1234-1234-1234' }
      );

      expect(
        new ConnectionString(
          connectionOptions.connectionString
        ).searchParams.get('directConnection')
      ).to.equal('true');
    });

    it('does not alter directConnection=false', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://localhost:27017/admin?directConnection=false',
        { _id: '1234-1234-1234-1234' }
      );

      expect(
        new ConnectionString(
          connectionOptions.connectionString
        ).searchParams.get('directConnection')
      ).to.equal('false');
    });

    it('does not add directConnection=true if replicaSet', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://localhost:27017/admin?replicaSet=rs1',
        { _id: '1234-1234-1234-1234' }
      );

      expect(
        new ConnectionString(
          connectionOptions.connectionString
        ).searchParams.has('directConnection')
      ).to.be.false;
    });

    it('does not add directConnection=true if srv', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb+srv://compass-data-sets.e06dc.mongodb.net',
        { _id: '1234-1234-1234-1234' }
      );

      expect(
        new ConnectionString(
          connectionOptions.connectionString
        ).searchParams.has('directConnection')
      ).to.be.false;
    });

    it('does not add directConnection=true if loadBalanced', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://localhost:27017/admin?loadBalanced=true',
        { _id: '1234-1234-1234-1234' }
      );

      expect(
        new ConnectionString(
          connectionOptions.connectionString
        ).searchParams.has('directConnection')
      ).to.be.false;
    });

    it('does not add directConnection=true if multiple hosts', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://localhost:27017,localhost2:27017/admin',
        { _id: '1234-1234-1234-1234' }
      );

      expect(
        new ConnectionString(
          connectionOptions.connectionString
        ).searchParams.has('directConnection')
      ).to.be.false;
    });

    it('removes appName if matches MongoDB Compass', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://localhost:27017/admin?appName=MongoDB+Compass',
        { _id: '1234-1234-1234-1234' }
      );

      expect(
        new ConnectionString(
          connectionOptions.connectionString
        ).searchParams.has('appName')
      ).to.be.false;
    });

    it('preserves appName if does not match MongoDB Compass', async function () {
      const { connectionOptions } = await createAndConvertModel(
        'mongodb://localhost:27017/admin?appName=Some+Other+App',
        { _id: '1234-1234-1234-1234' }
      );

      expect(
        new ConnectionString(
          connectionOptions.connectionString
        ).searchParams.get('appName')
      ).to.deep.equal('Some Other App');
    });

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
          '&tlsCertificateFile=pathToCertKey1' +
          '&tlsCertificateKeyFile=pathToCertKey2',
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
          '&tlsCertificateFile=pathToCertKey1' +
          '&tlsCertificateKeyFile=pathToCertKey2',
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
        id: '1',
        connectionOptions: {
          connectionString: 'mongodb://user:password@localhost:27017',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.connectionInfo).to.deep.equal({
        id: '1',
        connectionOptions: {
          connectionString: 'mongodb://user@localhost:27017/',
        },
      });

      expect(connectionModel.secrets).to.deep.equal({
        password: 'password',
      });
    });

    it('converts favorite and history properties', async function () {
      const id = '1234-1234-1234-1234';
      const lastUsed = new Date();
      const connectionInfo: ConnectionInfo = {
        id,
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

      expect(connectionModel._id).to.equal(id);
      expect(connectionModel.isFavorite).to.equal(true);
      expect(connectionModel.color).to.equal('blue');
      expect(connectionModel.name).to.equal('Local');
      expect(connectionModel.lastUsed).to.deep.equal(lastUsed);
    });

    it('converts authSource', async function () {
      const connectionInfo = {
        id: '2',
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
        id: '3',
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017/?replicaSet=rs1',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.replicaSet).to.equal('rs1');
    });

    it('converts readPreference', async function () {
      const connectionInfo = {
        id: '4',
        connectionOptions: {
          connectionString: 'mongodb://example.com/?readPreference=secondary',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.readPreference).to.equal('secondary');
    });

    it('converts readPreferenceTags', async function () {
      const connectionInfo = {
        id: '5',
        connectionOptions: {
          connectionString:
            'mongodb://example.com/?readPreferenceTags=tag1:a,tag2:b',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.readPreferenceTags).to.deep.equal([
        { tag1: 'a', tag2: 'b' },
      ]);
    });

    it('converts no auth', async function () {
      const connectionInfo: ConnectionInfo = {
        id: '6',
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

    it('converts username and password', async function () {
      const connectionInfo = {
        id: '7',
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
        id: '8',
        connectionOptions: {
          connectionString:
            'mongodb://mongodb.user%40EXAMPLE.COM@mongodb-kerberos-1.example.com:29017/?authMechanism=GSSAPI',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.authStrategy).to.equal('KERBEROS');
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
        id: '9',
        connectionOptions: {
          connectionString:
            'mongodb://mongodb.user%40EXAMPLE.COM@mongodb-kerberos-2.example.com:29018/?authMechanism=GSSAPI&authMechanismProperties=SERVICE_NAME%3Aalternate',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.authStrategy).to.equal('KERBEROS');
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
        id: '10',
        connectionOptions: {
          connectionString:
            'mongodb://mongodb.user%40EXAMPLE.COM@mongodb-kerberos-2.example.com:29018/?authMechanism=GSSAPI&authMechanismProperties=CANONICALIZE_HOST_NAME%3Atrue',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.authStrategy).to.equal('KERBEROS');
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

    it('converts LDAP', async function () {
      const connectionInfo = {
        id: '11',
        connectionOptions: {
          connectionString:
            'mongodb://writer%40EXAMPLE.COM:Password1!@localhost:30017/?authMechanism=PLAIN',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.authStrategy).to.equal('LDAP');
      expect(connectionModel.ldapUsername).to.equal('writer@EXAMPLE.COM');
      expect(connectionModel.ldapPassword).to.equal('Password1!');
    });

    it('converts SCRAM-SHA-1', async function () {
      const connectionInfo = {
        id: '12',
        connectionOptions: {
          connectionString:
            'mongodb://user:password@localhost:27017/?authMechanism=SCRAM-SHA-1',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.authStrategy).to.equal('MONGODB');
      expect(connectionModel.authMechanism).to.equal('SCRAM-SHA-1');
      expect(connectionModel.mongodbUsername).to.equal('user');
      expect(connectionModel.mongodbPassword).to.equal('password');
    });

    it('converts SCRAM-SHA-256', async function () {
      const connectionInfo = {
        id: '13',
        connectionOptions: {
          connectionString:
            'mongodb://user:password@localhost:27017/?authMechanism=SCRAM-SHA-256',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.authStrategy).to.equal('SCRAM-SHA-256');
      expect(connectionModel.authMechanism).to.equal('SCRAM-SHA-256');
      expect(connectionModel.mongodbUsername).to.equal('user');
      expect(connectionModel.mongodbPassword).to.equal('password');
    });

    it('converts X509', async function () {
      const connectionInfo = {
        id: '14',
        connectionOptions: {
          connectionString:
            'mongodb://user@localhost:27017/?authMechanism=MONGODB-X509&tls=true&tlsCertificateKeyFile=file.pem&authSource=$external',
        },
      };

      const connectionModel = await convertConnectionInfoToModel(
        connectionInfo
      );

      expect(connectionModel.authStrategy).to.equal('X509');
      expect(connectionModel.sslMethod).to.equal('ALL');
      expect(connectionModel.ssl).to.equal(true);
      expect(connectionModel.sslKey).to.equal('file.pem');
    });

    it('converts tls=false', async function () {
      const connectionModel = await convertConnectionInfoToModel({
        id: '15',
        connectionOptions: {
          connectionString: 'mongodb://user@localhost:27017/?tls=false',
        },
      });

      expect(connectionModel.sslMethod).to.equal('NONE');
    });

    it('converts ssl=false', async function () {
      const connectionModel = await convertConnectionInfoToModel({
        id: '16',
        connectionOptions: {
          connectionString: 'mongodb://user@localhost:27017/?ssl=false',
        },
      });

      expect(connectionModel.sslMethod).to.equal('NONE');
    });

    it('converts tls=true', async function () {
      const connectionModel = await convertConnectionInfoToModel({
        id: '17',
        connectionOptions: {
          connectionString: 'mongodb://user@localhost:27017/?tls=true',
        },
      });

      expect(connectionModel.sslMethod).to.equal('SYSTEMCA');
    });

    it('converts ssl=true', async function () {
      const connectionModel = await convertConnectionInfoToModel({
        id: '18',
        connectionOptions: {
          connectionString: 'mongodb://user@localhost:27017/?ssl=true',
        },
      });

      expect(connectionModel.sslMethod).to.equal('SYSTEMCA');
    });

    it('converts tlsCAFile', async function () {
      const connectionModel = await convertConnectionInfoToModel({
        id: '19',
        connectionOptions: {
          connectionString:
            'mongodb://user@localhost:27017/?ssl=true&tlsCAFile=file.pem',
        },
      });

      expect(connectionModel.sslMethod).to.equal('SERVER');
      expect(connectionModel.sslCA).to.deep.equal(['file.pem']);
    });

    it('converts tlsCertificateKeyFile and tlsCertificateFile', async function () {
      const connectionModel = await convertConnectionInfoToModel({
        id: '20',
        connectionOptions: {
          connectionString:
            'mongodb://user@localhost:27017/?ssl=true&tlsCAFile=tlsCAFilePath&tlsCertificateKeyFile=sslKeyPath&tlsCertificateFile=sslCertPath',
        },
      });

      expect(connectionModel.sslMethod).to.equal('ALL');
      expect(connectionModel.sslCA).to.deep.equal(['tlsCAFilePath']);
      expect(connectionModel.sslKey).to.equal('sslKeyPath');
      expect(connectionModel.sslCert).to.equal('sslCertPath');
    });

    it('converts tlsAllowInvalidCertificates and tlsAllowInvalidHostnames', async function () {
      const connectionModel = await convertConnectionInfoToModel({
        id: '21',
        connectionOptions: {
          connectionString:
            'mongodb://user@localhost:27017/?ssl=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true',
        },
      });

      expect(connectionModel.sslMethod).to.equal('UNVALIDATED');
    });

    it('converts ssh (USER_PASSWORD)', async function () {
      const connectionModel = await convertConnectionInfoToModel({
        id: '22',
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017',
          sshTunnel: {
            host: 'jumphost',
            port: 22,
            username: 'root',
            password: 'password',
          },
        },
      });

      expect(connectionModel.sshTunnel).to.equal('USER_PASSWORD');
      expect(connectionModel.sshTunnelHostname).to.equal('jumphost');
      expect(connectionModel.sshTunnelPort).to.equal(22);
      expect(connectionModel.sshTunnelUsername).to.equal('root');
      expect(connectionModel.sshTunnelPassword).to.equal('password');
    });

    it('converts ssh (IDENTITY_FILE)', async function () {
      const connectionModel = await convertConnectionInfoToModel({
        id: '23',
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017',
          sshTunnel: {
            host: 'jumphost',
            port: 22,
            identityKeyFile: 'myfile',
            username: 'root',
            identityKeyPassphrase: 'passphrase',
          },
        },
      });

      expect(connectionModel.sshTunnel).to.equal('IDENTITY_FILE');
      expect(connectionModel.sshTunnelHostname).to.equal('jumphost');
      expect(connectionModel.sshTunnelPort).to.equal(22);
      expect(connectionModel.sshTunnelUsername).to.equal('root');
      expect(connectionModel.sshTunnelIdentityFile).to.equal('myfile');
      expect(connectionModel.sshTunnelPassphrase).to.equal('passphrase');
    });

    it('strips out MONGODB-AWS but keeps it in connectionInfo and secrets', async function () {
      const connectionModel = await convertConnectionInfoToModel({
        id: '24',
        connectionOptions: {
          connectionString:
            'mongodb://username@localhost:27017/?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3AsessionToken',
        },
      });

      expect(connectionModel.authStrategy).to.equal('NONE');
      expect(
        connectionModel.connectionInfo.connectionOptions.connectionString
      ).to.equal(
        'mongodb://username@localhost:27017/?authMechanism=MONGODB-AWS'
      );

      expect(connectionModel.secrets.awsSessionToken).to.equal('sessionToken');
      expect(connectionModel.driverUrlWithSsh).to.equal(
        'mongodb://localhost:27017/?readPreference=primary&directConnection=true&ssl=true'
      );
    });
  });
});
