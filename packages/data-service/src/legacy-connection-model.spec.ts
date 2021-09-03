import { expect } from 'chai';
import { ConnectionOptions } from './connection-options';
import {
  convertConnectionModelToOptions,
  convertConnectionOptionsToModel,
  LegacyConnectionModelProperties,
} from './legacy-connection-model';

describe('legacy-connection-model', function () {
  describe('conversion', function () {
    const defaultId = 'fe8e41bb-e4e3-4417-b3b0-160731cca20f';
    const modelDefaults: any = {
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

    // Test case is options -> converted model =? model; model -> converted options =? optionsAfterConversion
    // we need "optionsAfterConversion" as the connection string is modified by ConnectionModel
    const tests: Array<{
      originalOptions: ConnectionOptions;
      expectedConvertedModel: LegacyConnectionModelProperties;
      expectedConvertedOptions?: ConnectionOptions;
    }> = [
      {
        originalOptions: {
          id: defaultId,
          connectionString: 'mongodb://localhost:27017/admin',
        },
        expectedConvertedModel: {
          ...modelDefaults,
          hostname: 'localhost',
          port: 27017,
          ns: 'admin',
          directConnection: true,
          hosts: [{ host: 'localhost', port: 27017 }],
        },
        expectedConvertedOptions: {
          id: defaultId,
          connectionString:
            'mongodb://localhost:27017/admin?readPreference=primary&directConnection=true&ssl=false',
        },
      },
      {
        originalOptions: {
          id: defaultId,
          connectionString: 'mongodb://user:password@localhost/admin?ssl=true',
        },
        expectedConvertedModel: {
          ...modelDefaults,
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
        expectedConvertedOptions: {
          id: defaultId,
          connectionString:
            'mongodb://user:password@localhost:27017/admin?authSource=admin&readPreference=primary&directConnection=true&ssl=true',
        },
      },
      {
        originalOptions: {
          id: defaultId,
          connectionString:
            'mongodb://user@localhost/admin?authMechanism=GSSAPI&authMechanismProperties=SERVICE_NAME%3Aalternate',
        },
        expectedConvertedModel: {
          ...modelDefaults,
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
        expectedConvertedOptions: {
          id: defaultId,
          connectionString:
            'mongodb://user@localhost:27017/admin?authMechanism=GSSAPI&readPreference=primary&authMechanismProperties=SERVICE_NAME%3Aalternate&directConnection=true&ssl=false&authSource=%24external',
        },
      },
      {
        originalOptions: {
          id: defaultId,
          connectionString: 'mongodb://localhost:27017/admin',
          sshTunnel: {
            host: 'jumphost',
            port: 22,
            username: 'root',
          },
        },
        expectedConvertedModel: {
          ...modelDefaults,
          hostname: 'localhost',
          port: 27017,
          ns: 'admin',
          directConnection: true,
          hosts: [{ host: 'localhost', port: 27017 }],
          sshTunnel: 'USER_PASSWORD',
          sshTunnelHostname: 'jumphost',
          sshTunnelPort: 22,
          sshTunnelUsername: 'root',
        },
        expectedConvertedOptions: {
          id: defaultId,
          connectionString:
            'mongodb://localhost:27017/admin?readPreference=primary&directConnection=true&ssl=false',
          sshTunnel: {
            host: 'jumphost',
            port: 22,
            username: 'root',
          },
        },
      },
      {
        originalOptions: {
          id: defaultId,
          connectionString: 'mongodb://localhost:27017/admin',
          favorite: {
            name: 'A Favorite',
            color: '#00ff00',
          },
        },
        expectedConvertedModel: {
          ...modelDefaults,
          hostname: 'localhost',
          port: 27017,
          ns: 'admin',
          directConnection: true,
          hosts: [{ host: 'localhost', port: 27017 }],
          isFavorite: true,
          name: 'A Favorite',
          color: '#00ff00',
        },
        expectedConvertedOptions: {
          id: defaultId,
          connectionString:
            'mongodb://localhost:27017/admin?readPreference=primary&directConnection=true&ssl=false',
          favorite: {
            name: 'A Favorite',
            color: '#00ff00',
          },
        },
      },
    ];

    // eslint-disable-next-line mocha/no-setup-in-describe
    tests.forEach(
      (
        { originalOptions, expectedConvertedModel, expectedConvertedOptions },
        i
      ) => {
        it(`can convert #${i}`, async function () {
          const convertedModel = await convertConnectionOptionsToModel(
            originalOptions
          );

          expect({
            ...convertedModel.toJSON(),
            _id: undefined,
            sshTunnelBindToLocalPort: undefined,
          }).to.deep.equal({
            ...expectedConvertedModel,
            _id: undefined,
            sshTunnelBindToLocalPort: undefined,
          });

          const convertedOptions =
            convertConnectionModelToOptions(convertedModel);
          expect(convertedOptions).to.deep.equal(expectedConvertedOptions);
        });
      }
    );
  });
});
