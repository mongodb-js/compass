import { expect } from 'chai';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { getExtraConnectionData } from './telemetry';

const connectionInfo: ConnectionInfo = {
  id: 'TEST',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27017',
  },
  favorite: {
    name: 'localhost',
    color: 'color_2',
  },
  savedConnectionType: 'recent',
};

describe('connection tracking', function () {
  it('tracks a new connection event - localhost', async function () {
    const [properties] = await getExtraConnectionData(connectionInfo);

    const expected = {
      is_localhost: true,
      is_public_cloud: false,
      is_do_url: false,
      is_atlas_url: false,
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      is_csfle: false,
      has_csfle_schema: false,
      count_kms_aws: 0,
      count_kms_local: 0,
      count_kms_gcp: 0,
      count_kms_kmip: 0,
      count_kms_azure: 0,
    };

    expect(properties).to.deep.equal(expected);
  });

  it('tracks a new connection event - digital ocean', async function () {
    const [properties] = await getExtraConnectionData({
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://example.mongo.ondigitalocean.com:27017',
      },
    });

    const expected = {
      is_localhost: false,
      is_public_cloud: false,
      is_do_url: true,
      is_atlas_url: false,
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      is_csfle: false,
      has_csfle_schema: false,
      count_kms_aws: 0,
      count_kms_local: 0,
      count_kms_gcp: 0,
      count_kms_kmip: 0,
      count_kms_azure: 0,
    };

    expect(properties).to.deep.equal(expected);
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  for (const { url, is_srv, title } of [
    {
      url: 'mongodb://compass-data-sets-shard-00-00.e06dc.mongodb.net',
      is_srv: false,
      title: 'no srv',
    },
    {
      url: 'mongodb+srv://compass-data-sets.e06dc.mongodb.net',
      is_srv: true,
      title: 'is srv',
    },
  ]) {
    it(`tracks a new connection event - ${title}`, async function () {
      const [properties] = await getExtraConnectionData({
        ...connectionInfo,
        connectionOptions: {
          connectionString: url,
        },
      });

      const expected = {
        is_localhost: false,
        is_do_url: false,
        is_atlas_url: true,
        auth_type: 'NONE',
        tunnel: 'none',
        is_srv: is_srv,
        is_csfle: false,
        has_csfle_schema: false,
        count_kms_aws: 0,
        count_kms_local: 0,
        count_kms_gcp: 0,
        count_kms_kmip: 0,
        count_kms_azure: 0,
        is_public_cloud: true,
        public_cloud_name: 'AWS',
      };

      expect(properties).to.deep.equal(expected);
    });
  }

  it('tracks a new connection event - atlas local dev', async function () {
    const [properties] = await getExtraConnectionData(connectionInfo);

    const expected = {
      is_localhost: true,
      is_public_cloud: false,
      is_do_url: false,
      is_atlas_url: false,
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      is_csfle: false,
      has_csfle_schema: false,
      count_kms_aws: 0,
      count_kms_local: 0,
      count_kms_gcp: 0,
      count_kms_kmip: 0,
      count_kms_azure: 0,
    };

    expect(properties).to.deep.equal(expected);
  });

  it('tracks a new connection event - public cloud', async function () {
    const [properties] = await getExtraConnectionData({
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://13.248.118.1',
      },
    });

    const expected = {
      is_localhost: false,
      is_public_cloud: true,
      is_do_url: false,
      is_atlas_url: false,
      public_cloud_name: 'AWS',
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      is_csfle: false,
      has_csfle_schema: false,
      count_kms_aws: 0,
      count_kms_local: 0,
      count_kms_gcp: 0,
      count_kms_kmip: 0,
      count_kms_azure: 0,
    };

    expect(properties).to.deep.equal(expected);
  });

  it('tracks a new connection event - public ip but not aws/gcp/azure', async function () {
    const [properties] = await getExtraConnectionData({
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://google.com',
      },
    });

    const expected = {
      is_localhost: false,
      is_public_cloud: false,
      is_do_url: false,
      is_atlas_url: false,
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      is_csfle: false,
      has_csfle_schema: false,
      count_kms_aws: 0,
      count_kms_local: 0,
      count_kms_gcp: 0,
      count_kms_kmip: 0,
      count_kms_azure: 0,
    };

    expect(properties).to.deep.equal(expected);
  });

  it('tracks a new connection event - nonexistent', async function () {
    const [properties] = await getExtraConnectionData({
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://nonexistent',
      },
    });

    const expected = {
      is_localhost: false,
      is_do_url: false,
      is_atlas_url: false,
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      is_csfle: false,
      has_csfle_schema: false,
      count_kms_aws: 0,
      count_kms_local: 0,
      count_kms_gcp: 0,
      count_kms_kmip: 0,
      count_kms_azure: 0,
    };

    expect(properties).to.deep.equal(expected);
  });

  it('tracks a new connection event - nonexistent SRV', async function () {
    const [properties] = await getExtraConnectionData({
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb+srv://nonexistent',
      },
    });

    const expected = {
      is_localhost: false,
      is_do_url: false,
      is_atlas_url: false,
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: true,
      is_csfle: false,
      has_csfle_schema: false,
      count_kms_aws: 0,
      count_kms_local: 0,
      count_kms_gcp: 0,
      count_kms_kmip: 0,
      count_kms_azure: 0,
    };

    expect(properties).to.deep.equal(expected);
  });

  ['', 'DEFAULT', 'GSSAPI', 'PLAIN', 'MONGODB-X509', 'SCRAM-SHA-256'].forEach(
    (authMechanism) => {
      it(`tracks a new connection event - ${
        authMechanism || 'DEFAULT'
      } auth`, async function () {
        const [properties] = await getExtraConnectionData({
          ...connectionInfo,
          connectionOptions: {
            connectionString: `mongodb://root:pwd@127.0.0.1?authMechanism=${authMechanism}`,
          },
        });
        expect(properties.auth_type).to.equal(authMechanism || 'DEFAULT');
      });
    }
  );

  it('tracks a new connection event - no auth', async function () {
    const [properties] = await getExtraConnectionData({
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://127.0.0.1?authMechanism=',
      },
    });
    expect(properties.auth_type).to.equal('NONE');
  });

  it('tracks a new connection event - no tunnel', async function () {
    const [properties] = await getExtraConnectionData(connectionInfo);
    expect(properties.tunnel).to.equal('none');
  });

  it('tracks a new connection event - ssh tunnel', async function () {
    const [properties] = await getExtraConnectionData({
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://127.0.0.1?authMechanism=',
        sshTunnel: {
          username: '',
          host: '',
          port: 0,
        },
      },
    });
    expect(properties.tunnel).to.equal('ssh');
  });

  it('tracks a new connection event - SRV', async function () {
    const [properties] = await getExtraConnectionData({
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb+srv://127.0.0.1',
      },
    });
    expect(properties.is_srv).to.equal(true);
  });

  describe('resolvedHostname', function () {
    it('tracks hostname without port', async function () {
      const [, hostname] = await getExtraConnectionData({
        ...connectionInfo,
        connectionOptions: {
          connectionString:
            'mongodb://test-000-shard-00-00.test.mongodb.net:27017',
        },
      });
      expect(hostname).to.equal('test-000-shard-00-00.test.mongodb.net');
    });

    it('tracks IPv6 hostname without port', async function () {
      const [, hostname] = await getExtraConnectionData({
        ...connectionInfo,
        connectionOptions: {
          connectionString: 'mongodb://[3fff:0:a88:15a3::ac2f]:8001/',
        },
      });
      expect(hostname).to.equal('3fff:0:a88:15a3::ac2f');
    });

    it('falls back to original url if cannot resolve srv', async function () {
      const [, hostname] = await getExtraConnectionData({
        ...connectionInfo,
        connectionOptions: {
          connectionString:
            // The fake srv connection string cannot be resolved, But expected
            // to fall back to the original hostname from uri When retrieving
            // atlas_hostname for telemetry
            'mongodb+srv://test-000-shard-00-00.test.mongodb.net:27017',
        },
      });
      expect(hostname).to.equal('test-000-shard-00-00.test.mongodb.net');
    });
  });

  it('tracks a new connection event - csfle on', async function () {
    const [properties] = await getExtraConnectionData({
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://127.128.0.0',
        fleOptions: {
          storeCredentials: false,
          autoEncryption: {
            kmsProviders: {
              local: { key: 'asdf' },
              'local:12': { key: 'asdf' },
              aws: { accessKeyId: 'asdf', secretAccessKey: 'asdf' },
              'kmip:1': { endpoint: 'asdf' },
            },
            encryptedFieldsMap: {
              ['foo.bar']: {},
            },
          },
        },
      },
    });

    const expected = {
      is_localhost: true,
      is_public_cloud: false,
      is_do_url: false,
      is_atlas_url: false,
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      is_csfle: true,
      has_csfle_schema: true,
      count_kms_aws: 1,
      count_kms_local: 2,
      count_kms_gcp: 0,
      count_kms_kmip: 1,
      count_kms_azure: 0,
    };

    expect(properties).to.deep.equal(expected);
  });
});
