import { once } from 'events';
import { expect } from 'chai';
import type { DataService } from 'mongodb-data-service';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import {
  trackConnectionAttemptEvent,
  trackNewConnectionEvent,
  trackConnectionFailedEvent,
} from './telemetry';
import { defaultPreferencesInstance } from 'compass-preferences-model';
import { createLogger } from '@mongodb-js/compass-logging';
import { createIpcTrack } from '@mongodb-js/compass-telemetry';

const dataService: Pick<DataService, 'instance' | 'getCurrentTopologyType'> = {
  instance: () => {
    return Promise.resolve({
      dataLake: {
        isDataLake: false,
        version: 'na',
      },
      genuineMongoDB: {
        dbType: 'na',
        isGenuine: true,
      },
      host: {},
      build: {
        isEnterprise: false,
        version: 'na',
      },
      isAtlas: false,
      isLocalAtlas: false,
      featureCompatibilityVersion: null,
    } as any);
  },
  getCurrentTopologyType: () => 'Unknown',
};

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
  let trackUsageStatistics: boolean;
  const logger = createLogger('TEST-CONNECTION');
  const track = createIpcTrack();

  before(async function () {
    // TODO(COMPASS-7397): Proper dependency injection for logger + telemetry would be nice here!
    trackUsageStatistics =
      defaultPreferencesInstance.getPreferences().trackUsageStatistics;
    await defaultPreferencesInstance.savePreferences({
      trackUsageStatistics: true,
    });
  });

  after(async function () {
    await defaultPreferencesInstance.savePreferences({ trackUsageStatistics });
  });

  it('tracks a new connection attempt event - favorite', async function () {
    const trackEvent = once(process, 'compass:track');
    trackConnectionAttemptEvent(
      {
        ...connectionInfo,
        favorite: { name: 'example' },
        lastUsed: undefined,
        savedConnectionType: 'favorite',
      },
      logger,
      track
    );
    const [{ properties }] = await trackEvent;

    expect(properties).to.deep.equal({
      is_favorite: true,
      is_recent: false,
      is_new: true,
      connection_id: 'TEST',
    });
  });

  it('tracks a new connection attempt event - recent', async function () {
    const trackEvent = once(process, 'compass:track');
    trackConnectionAttemptEvent(
      { ...connectionInfo, favorite: undefined, lastUsed: new Date() },
      logger,
      track
    );
    const [{ properties }] = await trackEvent;
    expect(properties).to.deep.equal({
      is_favorite: false,
      is_recent: true,
      is_new: false,
      connection_id: 'TEST',
    });
  });

  it('tracks a new connection attempt event - new', async function () {
    const trackEvent = once(process, 'compass:track');
    trackConnectionAttemptEvent(
      { ...connectionInfo, favorite: undefined, lastUsed: undefined },
      logger,
      track
    );
    const [{ properties }] = await trackEvent;
    expect(properties).to.deep.equal({
      is_favorite: false,
      is_recent: false,
      is_new: true,
      connection_id: 'TEST',
    });
  });

  it('tracks a new connection attempt event - favorite and recent', async function () {
    const trackEvent = once(process, 'compass:track');
    trackConnectionAttemptEvent(
      {
        ...connectionInfo,
        favorite: { name: 'example' },
        savedConnectionType: 'favorite',
        lastUsed: new Date(),
      },
      logger,
      track
    );
    const [{ properties }] = await trackEvent;
    expect(properties).to.deep.equal({
      is_favorite: true,
      is_recent: false,
      is_new: false,
      connection_id: 'TEST',
    });
  });

  it('tracks a new connection event - localhost', async function () {
    const trackEvent = once(process, 'compass:track');
    const connection: ConnectionInfo = {
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://localhost:27017',
      },
    };

    trackNewConnectionEvent(connection, dataService, logger, track);
    const [{ properties }] = await trackEvent;
    const expected = {
      is_localhost: true,
      is_public_cloud: false,
      is_do_url: false,
      is_atlas_url: false,
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      topology_type: 'Unknown',
      is_atlas: false,
      atlas_hostname: null,
      is_local_atlas: false,
      is_dataLake: false,
      is_enterprise: false,
      is_genuine: true,
      non_genuine_server_name: 'na',
      server_version: 'na',
      server_arch: undefined,
      server_os_family: undefined,
      is_csfle: false,
      has_csfle_schema: false,
      has_kms_aws: false,
      has_kms_local: false,
      has_kms_gcp: false,
      has_kms_kmip: false,
      has_kms_azure: false,
      connection_id: 'TEST',
    };

    expect(properties).to.deep.equal(expected);
  });

  it('tracks a new connection event - digital ocean', async function () {
    const trackEvent = once(process, 'compass:track');
    const connection: ConnectionInfo = {
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://example.mongo.ondigitalocean.com:27017',
      },
    };

    trackNewConnectionEvent(connection, dataService, logger, track);
    const [{ properties }] = await trackEvent;

    const expected = {
      is_localhost: false,
      is_public_cloud: false,
      is_do_url: true,
      is_atlas_url: false,
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      topology_type: 'Unknown',
      is_atlas: false,
      atlas_hostname: null,
      is_local_atlas: false,
      is_dataLake: false,
      is_enterprise: false,
      is_genuine: true,
      non_genuine_server_name: 'na',
      server_version: 'na',
      server_arch: undefined,
      server_os_family: undefined,
      is_csfle: false,
      has_csfle_schema: false,
      has_kms_aws: false,
      has_kms_local: false,
      has_kms_gcp: false,
      has_kms_kmip: false,
      has_kms_azure: false,
      connection_id: 'TEST',
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
      const trackEvent = once(process, 'compass:track');
      const connection: ConnectionInfo = {
        ...connectionInfo,
        connectionOptions: {
          connectionString: url,
        },
      };

      trackNewConnectionEvent(connection, dataService, logger, track);
      const [{ properties }] = await trackEvent;

      const expected = {
        is_localhost: false,
        is_do_url: false,
        is_atlas_url: true,
        auth_type: 'NONE',
        tunnel: 'none',
        is_srv: is_srv,
        topology_type: 'Unknown',
        is_atlas: false,
        atlas_hostname: null,
        is_local_atlas: false,
        is_dataLake: false,
        is_enterprise: false,
        is_genuine: true,
        non_genuine_server_name: 'na',
        server_version: 'na',
        server_arch: undefined,
        server_os_family: undefined,
        is_csfle: false,
        has_csfle_schema: false,
        has_kms_aws: false,
        has_kms_local: false,
        has_kms_gcp: false,
        has_kms_kmip: false,
        has_kms_azure: false,
        is_public_cloud: true,
        public_cloud_name: 'AWS',
        connection_id: 'TEST',
      };

      expect(properties).to.deep.equal(expected);
    });
  }

  it('tracks a new connection event - atlas local dev', async function () {
    const trackEvent = once(process, 'compass:track');

    const mockDataService: Pick<
      DataService,
      'instance' | 'getCurrentTopologyType'
    > = {
      instance: () => {
        return Promise.resolve({
          dataLake: {
            isDataLake: false,
            version: 'na',
          },
          genuineMongoDB: {
            dbType: 'na',
            isGenuine: true,
          },
          host: {},
          build: {
            isEnterprise: false,
            version: 'na',
          },
          isAtlas: false,
          isLocalAtlas: true,
          featureCompatibilityVersion: null,
        } as any);
      },
      getCurrentTopologyType: () => 'Unknown',
    };

    const connection: ConnectionInfo = {
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://localhost:27017/',
      },
    };

    trackNewConnectionEvent(connection, mockDataService, logger, track);
    const [{ properties }] = await trackEvent;

    const expected = {
      is_localhost: true,
      is_public_cloud: false,
      is_do_url: false,
      is_atlas_url: false,
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      topology_type: 'Unknown',
      is_atlas: false,
      atlas_hostname: null,
      is_local_atlas: true,
      is_dataLake: false,
      is_enterprise: false,
      is_genuine: true,
      non_genuine_server_name: 'na',
      server_version: 'na',
      server_arch: undefined,
      server_os_family: undefined,
      is_csfle: false,
      has_csfle_schema: false,
      has_kms_aws: false,
      has_kms_local: false,
      has_kms_gcp: false,
      has_kms_kmip: false,
      has_kms_azure: false,
      connection_id: 'TEST',
    };

    expect(properties).to.deep.equal(expected);
  });

  it('tracks a new connection event - public cloud', async function () {
    const trackEvent = once(process, 'compass:track');
    const connection: ConnectionInfo = {
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://13.248.118.1',
      },
    };

    trackNewConnectionEvent(connection, dataService, logger, track);
    const [{ properties }] = await trackEvent;

    const expected = {
      is_localhost: false,
      is_public_cloud: true,
      is_do_url: false,
      is_atlas_url: false,
      public_cloud_name: 'AWS',
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      topology_type: 'Unknown',
      is_atlas: false,
      atlas_hostname: null,
      is_local_atlas: false,
      is_dataLake: false,
      is_enterprise: false,
      is_genuine: true,
      non_genuine_server_name: 'na',
      server_version: 'na',
      server_arch: undefined,
      server_os_family: undefined,
      is_csfle: false,
      has_csfle_schema: false,
      has_kms_aws: false,
      has_kms_local: false,
      has_kms_gcp: false,
      has_kms_kmip: false,
      has_kms_azure: false,
      connection_id: 'TEST',
    };

    expect(properties).to.deep.equal(expected);
  });

  it('tracks a new connection event - public ip but not aws/gcp/azure', async function () {
    const trackEvent = once(process, 'compass:track');
    const connection: ConnectionInfo = {
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://google.com',
      },
    };

    trackNewConnectionEvent(connection, dataService, logger, track);
    const [{ properties }] = await trackEvent;

    const expected = {
      is_localhost: false,
      is_public_cloud: false,
      is_do_url: false,
      is_atlas_url: false,
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      topology_type: 'Unknown',
      is_atlas: false,
      atlas_hostname: null,
      is_local_atlas: false,
      is_dataLake: false,
      is_enterprise: false,
      is_genuine: true,
      non_genuine_server_name: 'na',
      server_version: 'na',
      server_arch: undefined,
      server_os_family: undefined,
      is_csfle: false,
      has_csfle_schema: false,
      has_kms_aws: false,
      has_kms_local: false,
      has_kms_gcp: false,
      has_kms_kmip: false,
      has_kms_azure: false,
      connection_id: 'TEST',
    };

    expect(properties).to.deep.equal(expected);
  });

  it('tracks a new connection event - nonexistent', async function () {
    const trackEvent = once(process, 'compass:track');
    const connection: ConnectionInfo = {
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://nonexistent',
      },
    };

    trackNewConnectionEvent(connection, dataService, logger, track);
    const [{ properties }] = await trackEvent;

    const expected = {
      is_localhost: false,
      is_do_url: false,
      is_atlas_url: false,
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      topology_type: 'Unknown',
      is_atlas: false,
      atlas_hostname: null,
      is_local_atlas: false,
      is_dataLake: false,
      is_enterprise: false,
      is_genuine: true,
      non_genuine_server_name: 'na',
      server_version: 'na',
      server_arch: undefined,
      server_os_family: undefined,
      is_csfle: false,
      has_csfle_schema: false,
      has_kms_aws: false,
      has_kms_local: false,
      has_kms_gcp: false,
      has_kms_kmip: false,
      has_kms_azure: false,
      connection_id: 'TEST',
    };

    expect(properties).to.deep.equal(expected);
  });

  it('tracks a new connection event - nonexistent SRV', async function () {
    const trackEvent = once(process, 'compass:track');
    const connection: ConnectionInfo = {
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb+srv://nonexistent',
      },
    };

    trackNewConnectionEvent(connection, dataService, logger, track);
    const [{ properties }] = await trackEvent;

    const expected = {
      is_localhost: false,
      is_do_url: false,
      is_atlas_url: false,
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: true,
      topology_type: 'Unknown',
      is_atlas: false,
      atlas_hostname: null,
      is_local_atlas: false,
      is_dataLake: false,
      is_enterprise: false,
      is_genuine: true,
      non_genuine_server_name: 'na',
      server_version: 'na',
      server_arch: undefined,
      server_os_family: undefined,
      is_csfle: false,
      has_csfle_schema: false,
      has_kms_aws: false,
      has_kms_local: false,
      has_kms_gcp: false,
      has_kms_kmip: false,
      has_kms_azure: false,
      connection_id: 'TEST',
    };

    expect(properties).to.deep.equal(expected);
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  ['', 'DEFAULT', 'GSSAPI', 'PLAIN', 'MONGODB-X509', 'SCRAM-SHA-256'].forEach(
    (authMechanism) => {
      it(`tracks a new connection event - ${
        authMechanism || 'DEFAULT'
      } auth`, async function () {
        const trackEvent = once(process, 'compass:track');
        const connection: ConnectionInfo = {
          ...connectionInfo,
          connectionOptions: {
            connectionString: `mongodb://root:pwd@127.0.0.1?authMechanism=${authMechanism}`,
          },
        };
        trackNewConnectionEvent(connection, dataService, logger, track);
        const [{ properties }] = await trackEvent;
        expect(properties.auth_type).to.equal(authMechanism || 'DEFAULT');
      });
    }
  );

  it('tracks a new connection event - no auth', async function () {
    const trackEvent = once(process, 'compass:track');
    const connection: ConnectionInfo = {
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://127.0.0.1?authMechanism=',
      },
    };
    trackNewConnectionEvent(connection, dataService, logger, track);
    const [{ properties }] = await trackEvent;
    expect(properties.auth_type).to.equal('NONE');
  });

  it('tracks a new connection event - no tunnel', async function () {
    const trackEvent = once(process, 'compass:track');
    const connection: ConnectionInfo = {
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://127.0.0.1?authMechanism=',
      },
    };
    trackNewConnectionEvent(connection, dataService, logger, track);
    const [{ properties }] = await trackEvent;
    expect(properties.tunnel).to.equal('none');
  });

  it('tracks a new connection event - ssh tunnel', async function () {
    const trackEvent = once(process, 'compass:track');
    const connection: ConnectionInfo = {
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://127.0.0.1?authMechanism=',
        sshTunnel: {
          username: '',
          host: '',
          port: 0,
        },
      },
    };
    trackNewConnectionEvent(connection, dataService, logger, track);
    const [{ properties }] = await trackEvent;
    expect(properties.tunnel).to.equal('ssh');
  });

  it('tracks a new connection event - SRV', async function () {
    const trackEvent = once(process, 'compass:track');
    const connection: ConnectionInfo = {
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb+srv://127.0.0.1',
      },
    };
    trackNewConnectionEvent(connection, dataService, logger, track);
    const [{ properties }] = await trackEvent;
    expect(properties.is_srv).to.equal(true);
  });

  it('tracks the instance data - case 1', async function () {
    const mockDataService: Pick<
      DataService,
      'instance' | 'getCurrentTopologyType'
    > = {
      instance: () => {
        return Promise.resolve({
          dataLake: {
            isDataLake: true,
            version: '1.2.3',
          },
          genuineMongoDB: {
            dbType: 'mongo',
            isGenuine: false,
          },
          host: {
            arch: 'darwin',
            os_family: 'mac',
          },
          build: {
            isEnterprise: true,
            version: '4.3.2',
          },
          isAtlas: true,
          isLocalAtlas: false,
          featureCompatibilityVersion: null,
        } as any);
      },
      getCurrentTopologyType: () => 'Unknown',
    };
    const trackEvent = once(process, 'compass:track');
    const connection: ConnectionInfo = {
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://test-data-sets-a011bb.mongodb.net',
      },
    };
    trackNewConnectionEvent(connection, mockDataService, logger, track);
    const [{ properties }] = await trackEvent;

    expect(properties.is_atlas).to.equal(true);
    expect(properties.atlas_hostname).to.equal(
      'test-data-sets-a011bb.mongodb.net'
    );
    expect(properties.is_local_atlas).to.equal(false);
    expect(properties.is_dataLake).to.equal(true);
    expect(properties.is_enterprise).to.equal(true);
    expect(properties.is_genuine).to.equal(false);
    expect(properties.non_genuine_server_name).to.equal('mongo');
    expect(properties.server_version).to.equal('4.3.2');
    expect(properties.server_arch).to.equal('darwin');
    expect(properties.server_os_family).to.equal('mac');
  });

  it('tracks the instance data - case 2', async function () {
    const mockDataService: Pick<
      DataService,
      'instance' | 'getCurrentTopologyType'
    > = {
      instance: () => {
        return Promise.resolve({
          dataLake: {
            isDataLake: false,
            version: '1.2.3',
          },
          genuineMongoDB: {
            dbType: 'mongo_2',
            isGenuine: true,
          },
          host: {
            arch: 'debian',
            os_family: 'ubuntu',
          },
          build: {
            isEnterprise: false,
            version: '4.3.9',
          },
          isAtlas: false,
          isLocalAtlas: false,
          featureCompatibilityVersion: null,
        } as any);
      },
      getCurrentTopologyType: () => 'Sharded',
    };
    const trackEvent = once(process, 'compass:track');
    const connection: ConnectionInfo = {
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://127.0.0.1',
      },
    };
    trackNewConnectionEvent(connection, mockDataService, logger, track);
    const [{ properties }] = await trackEvent;

    expect(properties.is_atlas).to.equal(false);
    expect(properties.atlas_hostname).to.equal(null);
    expect(properties.is_local_atlas).to.equal(false);
    expect(properties.is_dataLake).to.equal(false);
    expect(properties.is_enterprise).to.equal(false);
    expect(properties.is_genuine).to.equal(true);
    expect(properties.non_genuine_server_name).to.equal('mongo_2');
    expect(properties.server_version).to.equal('4.3.9');
    expect(properties.server_arch).to.equal('debian');
    expect(properties.server_os_family).to.equal('ubuntu');
    expect(properties.topology_type).to.equal('Sharded');
  });

  it('tracks connection error event', async function () {
    const trackEvent = once(process, 'compass:track');
    const connection: ConnectionInfo = {
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://localhost:27017',
      },
    };

    const connectionError = new Error();

    trackConnectionFailedEvent(connection, connectionError, logger, track);
    const [{ properties }] = await trackEvent;

    const expected = {
      is_localhost: true,
      is_public_cloud: false,
      is_do_url: false,
      is_atlas_url: false,
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      error_code: undefined,
      error_name: 'Error',
      is_csfle: false,
      has_csfle_schema: false,
      has_kms_aws: false,
      has_kms_local: false,
      has_kms_gcp: false,
      has_kms_kmip: false,
      has_kms_azure: false,
      connection_id: 'TEST',
    };

    expect(properties).to.deep.equal(expected);
  });

  it('tracks a new connection event - csfle on', async function () {
    const trackEvent = once(process, 'compass:track');
    const connection: ConnectionInfo = {
      ...connectionInfo,
      connectionOptions: {
        connectionString: 'mongodb://127.128.0.0',
        fleOptions: {
          storeCredentials: false,
          autoEncryption: {
            kmsProviders: {
              local: { key: 'asdf' },
              aws: { accessKeyId: 'asdf', secretAccessKey: 'asdf' },
            },
            encryptedFieldsMap: {
              ['foo.bar']: {},
            },
          },
        },
      },
    };

    trackNewConnectionEvent(connection, dataService, logger, track);
    const [{ properties, event }] = await trackEvent;

    const expected = {
      is_localhost: true,
      is_public_cloud: false,
      is_do_url: false,
      is_atlas_url: false,
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      topology_type: 'Unknown',
      is_atlas: false,
      atlas_hostname: null,
      is_local_atlas: false,
      is_dataLake: false,
      is_enterprise: false,
      is_genuine: true,
      non_genuine_server_name: 'na',
      server_version: 'na',
      server_arch: undefined,
      server_os_family: undefined,
      is_csfle: true,
      has_csfle_schema: true,
      has_kms_aws: true,
      has_kms_local: true,
      has_kms_gcp: false,
      has_kms_kmip: false,
      has_kms_azure: false,
      connection_id: 'TEST',
    };

    expect(event).to.equal('New Connection');
    expect(properties).to.deep.equal(expected);
  });
});
