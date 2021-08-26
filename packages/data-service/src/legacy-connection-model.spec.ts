import { expect } from 'chai';
import { ConnectionOptions } from './connection-options';
import {
  convertConnectionModelToOptions,
  convertConnectionOptionsToModel,
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

describe('legacy-connection-model', function () {
  describe('conversion', function () {
    const modelDefaults: any = {
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

    // Test case is options -> converted model =? model; model -> converted options =? inverseOptions
    // we need "inverseOptions" as the connection string is modified by ConnectionModel
    const tests: Array<{
      options: ConnectionOptions;
      model: LegacyConnectionModelProperties;
      inverseOptions?: ConnectionOptions;
    }> = [
      {
        options: {
          connectionString: 'mongodb://localhost:27017/admin',
        },
        model: {
          ...modelDefaults,
          hostname: 'localhost',
          port: 27017,
          ns: 'admin',
          directConnection: true,
          hosts: [{ host: 'localhost', port: 27017 }],
        },
        inverseOptions: {
          connectionString:
            'mongodb://localhost:27017/admin?readPreference=primary&directConnection=true&ssl=false',
        },
      },
      {
        options: {
          connectionString: 'mongodb://user:password@localhost/admin?ssl=true',
        },
        model: {
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
        inverseOptions: {
          connectionString:
            'mongodb://user:password@localhost:27017/admin?authSource=admin&readPreference=primary&directConnection=true&ssl=true',
        },
      },
      {
        options: {
          connectionString:
            'mongodb://user@localhost/admin?authMechanism=GSSAPI&authMechanismProperties=SERVICE_NAME%3Aalternate',
        },
        model: {
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
        inverseOptions: {
          connectionString:
            'mongodb://user@localhost:27017/admin?authMechanism=GSSAPI&readPreference=primary&authMechanismProperties=SERVICE_NAME%3Aalternate&directConnection=true&ssl=false&authSource=%24external',
        },
      },
      {
        options: {
          connectionString: 'mongodb://localhost:27017/admin',
          sshTunnel: {
            host: 'jumphost',
            port: 22,
            username: 'root',
          },
        },
        model: {
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
        inverseOptions: {
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
        options: {
          connectionString: 'mongodb://localhost:27017/admin',
          favorite: {
            name: 'A Favorite',
            color: '#00ff00',
          },
        },
        model: {
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
        inverseOptions: {
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
    tests.forEach(({ options, model, inverseOptions }, i) => {
      it(`can convert #${i}`, async function () {
        const convertedModel = await convertConnectionOptionsToModel(options);
        expectConnectionModelEquals(convertedModel, model);

        const convertedOptions =
          convertConnectionModelToOptions(convertedModel);
        expect(convertedOptions).to.deep.equal(inverseOptions ?? options);
      });
    });
  });
});
