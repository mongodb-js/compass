import _ from 'lodash';
import { expect } from 'chai';
import type { ConnectionInfo } from './connection-info';
import type { ConnectionSecrets } from './connection-secrets';
import { mergeSecrets, extractSecrets } from './connection-secrets';
import { UUID } from 'bson';

describe('connection secrets', function () {
  describe('mergeSecrets', function () {
    it('does not modify the original object', function () {
      const originalConnectionInfo: ConnectionInfo = {
        id: '123',
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
        tlsCertificateKeyFilePassword: 'xxx',
        proxyPassword: 'xxx',
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
        id: '123',
        connectionOptions: {
          connectionString:
            'mongodb://username@localhost:27017/?proxyHost=localhost&proxyUsername=foo',
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
        sshTunnelPassword: 'password',
        sshTunnelPassphrase: 'passphrase',
        tlsCertificateKeyFilePassword: 'tlsCertPassword',
        proxyPassword: 'bar',
      });

      expect(newConnectionInfo).to.be.deep.equal({
        id: '123',
        connectionOptions: {
          connectionString:
            'mongodb://username:userPassword@localhost:27017/?' +
            'proxyHost=localhost&proxyUsername=foo&' +
            'tlsCertificateKeyFilePassword=tlsCertPassword&' +
            'proxyPassword=bar&' +
            'authMechanismProperties=AWS_SESSION_TOKEN%3AsessionToken',
          sshTunnel: {
            host: 'localhost',
            username: 'user',
            password: 'password',
            port: 22,
            identityKeyPassphrase: 'passphrase',
          },
        },
      } as ConnectionInfo);
    });

    it('merges secrets for a cosmosdb connection string', function () {
      const originalConnectionInfo: ConnectionInfo = {
        id: '123',
        connectionOptions: {
          connectionString:
            'mongodb://database-ut@database-haha.mongo.cosmos.azure.com:8888/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@database-haha@',
        },
      };

      const newConnectionInfo = mergeSecrets(originalConnectionInfo, {
        password: 'userPassword',
      });

      expect(newConnectionInfo).to.be.deep.equal({
        id: '123',
        connectionOptions: {
          connectionString:
            'mongodb://database-ut:userPassword@database-haha.mongo.cosmos.azure.com:8888/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@database-haha@',
        },
      } as ConnectionInfo);
    });
  });

  describe('extractSecrets', function () {
    it('does not modify the original object', function () {
      const originalConnectionInfo: ConnectionInfo = {
        id: '123',
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
        id: '123',
        connectionOptions: {
          connectionString:
            'mongodb://username:userPassword@localhost:27017/?' +
            'tlsCertificateKeyFilePassword=tlsCertPassword&' +
            'authMechanismProperties=AWS_SESSION_TOKEN%3AsessionToken&' +
            'proxyHost=localhost&proxyUsername=foo&proxyPassword=bar',
          sshTunnel: {
            host: 'localhost',
            username: 'user',
            password: 'password',
            port: 22,
            identityKeyPassphrase: 'passphrase',
          },
          oidc: {
            serializedState: 'oidcSerializedState',
            openBrowser: false,
            redirectURI: 'redirectURI',
          },
          fleOptions: {
            storeCredentials: true,
            autoEncryption: {
              keyVaultNamespace: 'keyVaultNamespace',
              kmsProviders: {
                aws: {
                  accessKeyId: 'accessKeyId',
                  secretAccessKey: 'secretAccessKey',
                  sessionToken: 'sessionToken',
                },
                local: {
                  key: 'key',
                },
                azure: {
                  tenantId: 'tenantId',
                  clientId: 'clientId',
                  clientSecret: 'clientSecret',
                  identityPlatformEndpoint: 'identityPlatformEndpoint',
                },
                gcp: {
                  email: 'email',
                  privateKey: 'privateKey',
                  endpoint: 'endpoint',
                },
                kmip: {
                  endpoint: 'endpoint',
                },
              },
              tlsOptions: {
                aws: {
                  tlsCertificateKeyFile: 'file',
                  tlsCertificateKeyFilePassword: 'pwd',
                },
                local: {
                  tlsCertificateKeyFile: 'file',
                  tlsCertificateKeyFilePassword: 'pwd',
                },
                azure: {
                  tlsCertificateKeyFile: 'file',
                  tlsCertificateKeyFilePassword: 'pwd',
                },
                gcp: {
                  tlsCertificateKeyFile: 'file',
                  tlsCertificateKeyFilePassword: 'pwd',
                },
                kmip: {
                  tlsCertificateKeyFile: 'file',
                  tlsCertificateKeyFilePassword: 'pwd',
                },
              },
            },
          },
        },
      };

      const { connectionInfo: newConnectionInfo, secrets } = extractSecrets(
        originalConnectionInfo
      );

      expect(newConnectionInfo).to.be.deep.equal({
        id: '123',
        connectionOptions: {
          connectionString:
            'mongodb://username@localhost:27017/?proxyHost=localhost&proxyUsername=foo',
          sshTunnel: {
            host: 'localhost',
            username: 'user',
            port: 22,
          },
          oidc: {
            openBrowser: false,
            redirectURI: 'redirectURI',
          },
          fleOptions: {
            storeCredentials: true,
            autoEncryption: {
              keyVaultNamespace: 'keyVaultNamespace',
              kmsProviders: {
                aws: {
                  accessKeyId: 'accessKeyId',
                },
                azure: {
                  tenantId: 'tenantId',
                  clientId: 'clientId',
                  identityPlatformEndpoint: 'identityPlatformEndpoint',
                },
                gcp: {
                  email: 'email',
                  endpoint: 'endpoint',
                },
                kmip: {
                  endpoint: 'endpoint',
                },
              },
              tlsOptions: {
                aws: {
                  tlsCertificateKeyFile: 'file',
                },
                local: {
                  tlsCertificateKeyFile: 'file',
                },
                azure: {
                  tlsCertificateKeyFile: 'file',
                },
                gcp: {
                  tlsCertificateKeyFile: 'file',
                },
                kmip: {
                  tlsCertificateKeyFile: 'file',
                },
              },
            },
          },
        },
      } as ConnectionInfo);

      expect(secrets).to.be.deep.equal({
        awsSessionToken: 'sessionToken',
        password: 'userPassword',
        sshTunnelPassword: 'password',
        sshTunnelPassphrase: 'passphrase',
        tlsCertificateKeyFilePassword: 'tlsCertPassword',
        proxyPassword: 'bar',
        oidcSerializedState: 'oidcSerializedState',
        autoEncryption: {
          kmsProviders: {
            aws: {
              secretAccessKey: 'secretAccessKey',
              sessionToken: 'sessionToken',
            },
            local: {
              key: 'key',
            },
            azure: {
              clientSecret: 'clientSecret',
            },
            gcp: {
              privateKey: 'privateKey',
            },
          },
          tlsOptions: {
            aws: {
              tlsCertificateKeyFilePassword: 'pwd',
            },
            local: {
              tlsCertificateKeyFilePassword: 'pwd',
            },
            azure: {
              tlsCertificateKeyFilePassword: 'pwd',
            },
            gcp: {
              tlsCertificateKeyFilePassword: 'pwd',
            },
            kmip: {
              tlsCertificateKeyFilePassword: 'pwd',
            },
          },
        },
      } as ConnectionSecrets);

      const { connectionInfo: newConnectionInfoNoFle, secrets: secretsNoFle } =
        extractSecrets(
          _.set(
            _.cloneDeep(originalConnectionInfo),
            'connectionOptions.fleOptions.storeCredentials',
            false
          )
        );

      expect(newConnectionInfoNoFle).to.deep.equal(
        _.set(
          _.cloneDeep(newConnectionInfo),
          'connectionOptions.fleOptions.storeCredentials',
          false
        )
      );
      expect(secretsNoFle).to.deep.equal(_.omit(secrets, 'autoEncryption'));
    });

    it('extracts secrets for a cosmosdb connection string', function () {
      const originalConnectionInfo: ConnectionInfo = {
        id: '123',
        connectionOptions: {
          connectionString:
            'mongodb://database-ut:somerandomsecret@database-haha.mongo.cosmos.azure.com:8888/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@database-haha@',
        },
      };

      const { connectionInfo: newConnectionInfo, secrets } = extractSecrets(
        originalConnectionInfo
      );

      expect(newConnectionInfo).to.be.deep.equal({
        id: '123',
        connectionOptions: {
          connectionString:
            'mongodb://database-ut@database-haha.mongo.cosmos.azure.com:8888/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@database-haha@',
        },
      } as ConnectionInfo);

      expect(secrets).to.be.deep.equal({
        password: 'somerandomsecret',
      } as ConnectionSecrets);

      const { connectionInfo: newConnectionInfoNoFle, secrets: secretsNoFle } =
        extractSecrets(
          _.set(
            _.cloneDeep(originalConnectionInfo),
            'connectionOptions.fleOptions.storeCredentials',
            false
          )
        );

      expect(newConnectionInfoNoFle).to.deep.equal(
        _.set(
          _.cloneDeep(newConnectionInfo),
          'connectionOptions.fleOptions.storeCredentials',
          false
        )
      );
      expect(secretsNoFle).to.deep.equal(_.omit(secrets, 'autoEncryption'));
    });

    context('extracts fle secrets', function () {
      it('does not extract fle secrets if fleOptions.storeCredentials is false', function () {
        const id = new UUID().toString();
        const connectionInfo = {
          id,
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017',
            fleOptions: {
              storeCredentials: false,
              autoEncryption: {
                keyVaultNamespace: 'db.coll',
                kmsProviders: {
                  local: {
                    key: 'my-key',
                  },
                },
              },
            },
          },
        };

        const { secrets } = extractSecrets(connectionInfo);
        expect(secrets).to.deep.equal({});
      });
      it('extracts fle secrets if fleOptions.storeCredentials is true', function () {
        const id = new UUID().toString();
        const connectionInfo = {
          id,
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017',
            fleOptions: {
              storeCredentials: true,
              autoEncryption: {
                keyVaultNamespace: 'db.coll',
                kmsProviders: {
                  local: {
                    key: 'my-key',
                  },
                },
              },
            },
          },
        };

        const { secrets } = extractSecrets(connectionInfo);
        expect(secrets).to.deep.equal({
          autoEncryption: {
            kmsProviders: {
              local: {
                key: 'my-key',
              },
            },
          },
        });
      });
    });
  });
});
