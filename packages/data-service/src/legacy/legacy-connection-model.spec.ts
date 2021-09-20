import { expect } from 'chai';
import path from 'path';
import { ConnectionInfo } from '../connection-info';

import { ConnectionOptions, ConnectionSshOptions } from '../connection-options';
import {
  convertConnectionInfoToModel,
  convertConnectionModelToInfo,
  // convertConnectionInfoToModel,
  LegacyConnectionModel,
  LegacyConnectionModelProperties,
} from './legacy-connection-model';

function expectConnectionModelEquals(
  model1: LegacyConnectionModel,
  model2: LegacyConnectionModelProperties
): void {
  expect({
    ...model1.toJSON(),
    _id: undefined,
    sshTunnelBindToLocalPort: undefined,
  }).to.deep.equal({
    ...model2,
    _id: undefined,
    sshTunnelBindToLocalPort: undefined,
  });
}

async function expectConversion(
  info: ConnectionInfo,
  model: LegacyConnectionModelProperties,
  inverseOptions?: ConnectionInfo
) {
  const convertedModel = await convertConnectionInfoToModel(info);
  expectConnectionModelEquals(convertedModel, model);

  const convertedOptions = convertConnectionModelToInfo(convertedModel);
  expect(convertedOptions).to.deep.equal(inverseOptions ?? info);
}

const defaultId = 'fe8e41bb-e4e3-4417-b3b0-160731cca20f';
const MODEL_DEFAULTS: any = {
  _id: defaultId,
  authStrategy: 'NONE',
  sshTunnel: 'NONE',
  sshTunnelPort: 22,
  sslMethod: 'NONE',
  readPreference: 'primary',
  connectionType: 'NODE_DRIVER',
  extraOptions: {},
  isFavorite: false,
  name: 'Local',
  isSrvRecord: false,
  kerberosCanonicalizeHostname: false,
  lastUsed: null,
};

describe('legacy-connection-model', function () {
  describe('simple conversion', function () {
    // Test case is originalInfo -> converted model =? expectedConvertedModel; model -> converted options =? expectedConvertedInfo
    // we need "expectedConvertedInfo" as the connection string is modified by ConnectionModel
    const tests: Array<{
      originalInfo: ConnectionInfo;
      expectedConvertedModel: LegacyConnectionModelProperties;
      expectedConvertedInfo?: ConnectionInfo;
    }> = [
      {
        originalInfo: {
          id: defaultId,
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017/admin',
          },
        },
        expectedConvertedModel: {
          ...MODEL_DEFAULTS,
          hostname: 'localhost',
          port: 27017,
          ns: 'admin',
          directConnection: true,
          hosts: [{ host: 'localhost', port: 27017 }],
        },
        expectedConvertedInfo: {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27017/admin?readPreference=primary&directConnection=true&ssl=false',
          },
        },
      },
      {
        originalInfo: {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://user:password@localhost/admin?ssl=true',
          },
        },
        expectedConvertedModel: {
          ...MODEL_DEFAULTS,
          hostname: 'localhost',
          port: 27017,
          ns: 'admin',
          directConnection: true,
          hosts: [{ host: 'localhost', port: 27017 }],
          authStrategy: 'MONGODB',
          mongodbDatabaseName: 'admin',
          mongodbUsername: 'user',
          mongodbPassword: 'password',
          ssl: true,
        },
        expectedConvertedInfo: {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://user:password@localhost:27017/admin?authSource=admin&readPreference=primary&directConnection=true&ssl=true',
          },
        },
      },
    ];

    // eslint-disable-next-line mocha/no-setup-in-describe
    tests.forEach(
      ({ originalInfo, expectedConvertedModel, expectedConvertedInfo }, i) => {
        it(`can convert #${originalInfo.connectionOptions.connectionString}`, async function () {
          await expectConversion(
            originalInfo,
            expectedConvertedModel,
            expectedConvertedInfo
          );
        });
      }
    );
  });

  describe('SSH tunnel', function () {
    const baseConnectionString = 'mongodb://localhost:27017/admin';
    const baseModel: LegacyConnectionModelProperties = {
      ...MODEL_DEFAULTS,
      hostname: 'localhost',
      port: 27017,
      ns: 'admin',
      directConnection: true,
      hosts: [{ host: 'localhost', port: 27017 }],
      sshTunnelHostname: 'jumphost',
      sshTunnelPort: 22,
      sshTunnelUsername: 'root',
    };
    const baseInverseConnectionString =
      'mongodb://localhost:27017/admin?readPreference=primary&directConnection=true&ssl=false';

    const optionsWithSsh = (
      connectionString: string,
      sshTunnel: Partial<ConnectionSshOptions>
    ): ConnectionInfo => {
      return {
        id: defaultId,
        connectionOptions: {
          connectionString,
          sshTunnel: {
            host: 'jumphost',
            port: 22,
            username: 'root',
            ...sshTunnel,
          },
        },
      };
    };

    it('converts an SSH tunnel with username', async function () {
      await expectConversion(
        optionsWithSsh(baseConnectionString, {}),
        {
          ...baseModel,
          sshTunnel: 'USER_PASSWORD',
        },
        optionsWithSsh(baseInverseConnectionString, {})
      );
    });

    it('converts an SSH tunnel with username/password', async function () {
      const ssh: Partial<ConnectionSshOptions> = {
        username: 'root',
        password: 'mypass',
      };
      await expectConversion(
        optionsWithSsh(baseConnectionString, ssh),
        {
          ...baseModel,
          sshTunnel: 'USER_PASSWORD',
          sshTunnelUsername: 'root',
          sshTunnelPassword: 'mypass',
        },
        optionsWithSsh(baseInverseConnectionString, ssh)
      );
    });

    it('converts an SSH tunnel with key file', async function () {
      const ssh: Partial<ConnectionSshOptions> = { identityKeyFile: 'myfile' };
      await expectConversion(
        optionsWithSsh(baseConnectionString, ssh),
        {
          ...baseModel,
          sshTunnel: 'IDENTITY_FILE',
          sshTunnelIdentityFile: 'myfile',
        },
        optionsWithSsh(baseInverseConnectionString, ssh)
      );
    });

    it('converts an SSH tunnel with key file and passphrase', async function () {
      const ssh: Partial<ConnectionSshOptions> = {
        identityKeyFile: 'myfile',
        identityKeyPassphrase: 'mypass',
      };
      await expectConversion(
        optionsWithSsh(baseConnectionString, ssh),
        {
          ...baseModel,
          sshTunnel: 'IDENTITY_FILE',
          sshTunnelIdentityFile: 'myfile',
          sshTunnelPassphrase: 'mypass',
        },
        optionsWithSsh(baseInverseConnectionString, ssh)
      );
    });

    it('converts sshTunnelOptions correctly (password)', async function () {
      const connectionOptions = {
        connectionString: 'mongodb://mongo:27017',
        sshTunnel: {
          host: 'localhost',
          port: 22222,
          username: 'root',
          password: 'password',
        },
      };

      const legacyModel = await convertConnectionInfoToModel({
        connectionOptions,
      });

      expect(legacyModel.sshTunnel).to.equal('USER_PASSWORD');

      expect({
        ...legacyModel.sshTunnelOptions,
        localPort: undefined,
      }).to.deep.equal({
        dstAddr: 'mongo',
        dstPort: 27017,
        forwardTimeout: 20000,
        host: 'localhost',
        keepaliveInterval: 20000,
        localAddr: '127.0.0.1',
        localPort: undefined,
        password: 'password',
        port: 22222,
        readyTimeout: 20000,
        srcAddr: '127.0.0.1',
        username: 'root',
      });
    });

    it('converts sshTunnelOptions correctly (identity key)', async function () {
      const connectionOptions: ConnectionOptions = {
        connectionString: 'mongodb://mongo:27017',
        sshTunnel: {
          host: 'localhost',
          port: 22222,
          username: 'root',
          identityKeyFile: path.resolve(__dirname, 'fakeidkey'),
        },
      };

      const legacyModel = await convertConnectionInfoToModel({
        connectionOptions,
      });

      expect(legacyModel.sshTunnel).to.equal('IDENTITY_FILE');

      expect({
        ...legacyModel.sshTunnelOptions,
        localPort: undefined,
        privateKey: legacyModel.sshTunnelOptions.privateKey.toString(),
      }).to.deep.equal({
        dstAddr: 'mongo',
        dstPort: 27017,
        forwardTimeout: 20000,
        host: 'localhost',
        keepaliveInterval: 20000,
        localAddr: '127.0.0.1',
        localPort: undefined,
        privateKey: 'hi!',
        port: 22222,
        readyTimeout: 20000,
        srcAddr: '127.0.0.1',
        username: 'root',
      });
    });
  });

  describe('Favorite information', function () {
    it('converts favorite data if present', async function () {
      await expectConversion(
        {
          id: defaultId,
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017/admin',
          },
          favorite: {
            name: 'A Favorite',
            color: '#00ff00',
          },
        },
        {
          ...MODEL_DEFAULTS,
          hostname: 'localhost',
          port: 27017,
          ns: 'admin',
          directConnection: true,
          hosts: [{ host: 'localhost', port: 27017 }],
          isFavorite: true,
          name: 'A Favorite',
          color: '#00ff00',
        },
        {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27017/admin?readPreference=primary&directConnection=true&ssl=false',
          },
          favorite: {
            name: 'A Favorite',
            color: '#00ff00',
          },
        }
      );
    });
  });

  describe('Kerberos options', function () {
    it('converts basic Kerberos auth properties', async function () {
      await expectConversion(
        {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://user@localhost/admin?authMechanism=GSSAPI&authMechanismProperties=SERVICE_NAME%3Aalternate',
          },
        },
        {
          ...MODEL_DEFAULTS,
          hostname: 'localhost',
          port: 27017,
          ns: 'admin',
          directConnection: true,
          hosts: [{ host: 'localhost', port: 27017 }],
          authStrategy: 'KERBEROS',
          kerberosPrincipal: 'user',
          kerberosServiceName: 'alternate',
          authMechanism: 'GSSAPI',
          authMechanismProperties: {},
        },
        {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://user@localhost:27017/admin?authMechanism=GSSAPI&readPreference=primary&authMechanismProperties=SERVICE_NAME%3Aalternate&directConnection=true&ssl=false&authSource=%24external',
          },
        }
      );
    });
  });

  describe('SSL options', function () {
    const baseModel: LegacyConnectionModelProperties = {
      ...MODEL_DEFAULTS,
      hostname: 'localhost',
      port: 27017,
      directConnection: true,
      hosts: [{ host: 'localhost', port: 27017 }],
    };

    it('converts system CA', async function () {
      await expectConversion(
        {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost/?tlsAllowInvalidCertificates=false&tlsAllowInvalidHostnames=false&tls=true',
          },
        },
        {
          ...baseModel,
          sslMethod: 'SYSTEMCA',
          ssl: true,
        },
        {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27017/?readPreference=primary&directConnection=true&ssl=true&tlsAllowInvalidCertificates=false&tlsAllowInvalidHostnames=false',
          },
        }
      );
    });

    it('converts server validation', async function () {
      await expectConversion(
        {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost/?tlsAllowInvalidCertificates=false&tlsCAFile=pathToCaFile',
          },
        },
        {
          ...baseModel,
          sslMethod: 'SERVER',
          ssl: true,
          sslCA: ['pathToCaFile'],
        },
        {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27017/?readPreference=primary&directConnection=true&ssl=true&tlsAllowInvalidCertificates=false&tlsCAFile=pathToCaFile',
          },
        }
      );

      await expectConversion(
        {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost/?tls=true&tlsCAFile=pathToCaFile',
          },
        },
        {
          ...baseModel,
          sslMethod: 'SERVER',
          ssl: true,
          sslCA: ['pathToCaFile'],
        },
        {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27017/?readPreference=primary&directConnection=true&ssl=true&tlsAllowInvalidCertificates=false&tlsCAFile=pathToCaFile',
          },
        }
      );
    });

    it('converts client/server validation (no passphrase)', async function () {
      await expectConversion(
        {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost/?tlsAllowInvalidCertificates=false&tlsCAFile=pathToCaFile&tlsCertificateKeyFile=pathToCertKey&tls=true',
          },
        },
        {
          ...baseModel,
          sslMethod: 'ALL',
          ssl: true,
          sslCA: ['pathToCaFile'],
          sslCert: 'pathToCertKey',
          sslKey: 'pathToCertKey',
        },
        {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27017/?readPreference=primary&directConnection=true&ssl=true&tlsAllowInvalidCertificates=false&tlsCAFile=pathToCaFile&tlsCertificateKeyFile=pathToCertKey',
          },
        }
      );
    });

    it('converts client/server validation (with passphrase)', async function () {
      await expectConversion(
        {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost/?tlsAllowInvalidCertificates=false&tlsCAFile=pathToCaFile&tlsCertificateKeyFile=pathToCertKey&tlsCertificateKeyFilePassword=pass',
            tlsCertificateFile: 'pathToCert',
          },
        },
        {
          ...baseModel,
          sslMethod: 'ALL',
          ssl: true,
          sslCA: ['pathToCaFile'],
          sslCert: 'pathToCert',
          sslKey: 'pathToCertKey',
          sslPass: 'pass',
        },
        {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27017/?readPreference=primary&directConnection=true&ssl=true&tlsAllowInvalidCertificates=false&tlsCAFile=pathToCaFile&tlsCertificateKeyFile=pathToCertKey&tlsCertificateKeyFilePassword=pass',
            tlsCertificateFile: 'pathToCert',
          },
        }
      );
    });

    it('converts insecure', async function () {
      await expectConversion(
        {
          id: defaultId,
          connectionOptions: {
            connectionString: 'mongodb://localhost/?tls=true&tlsInsecure=true',
          },
        },
        {
          ...baseModel,
          sslMethod: 'UNVALIDATED',
          ssl: true,
        },
        {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27017/?readPreference=primary&directConnection=true&ssl=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true',
          },
        }
      );
    });

    it('converts unvalidated', async function () {
      await expectConversion(
        {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost/?tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true&tls=true',
          },
        },
        {
          ...baseModel,
          sslMethod: 'UNVALIDATED',
          ssl: true,
        },
        {
          id: defaultId,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27017/?readPreference=primary&directConnection=true&ssl=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true',
          },
        }
      );
    });
  });
});
