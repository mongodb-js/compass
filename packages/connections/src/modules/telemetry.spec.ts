import { once } from 'events';
import { expect } from 'chai';
import { DataService } from 'mongodb-data-service';

import {
  trackConnectionAttemptEvent,
  trackNewConnectionEvent,
  trackConnectionFailedEvent,
} from './telemetry';

const initialHadronApp = (global as any).hadronApp;

const dataService: Pick<DataService, 'instance'> = {
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
      featureCompatibilityVersion: null,
    });
  },
};

describe('connection tracking', function () {
  beforeEach(function () {
    (global as any).hadronApp = { isFeatureEnabled: () => true };
  });

  afterEach(function() {
    (global as any).hadronApp = initialHadronApp;
  });

  it('tracks a new connection attempt event - favorite', async function () {
    const trackEvent = once(process, 'compass:track');
    trackConnectionAttemptEvent(
      { favorite: { name: 'example' }, lastUsed: null }
    );
    const [ { properties } ] = await trackEvent;

    expect(properties).to.deep.equal({
      is_favorite: true,
      is_recent: false,
      is_new: true,
    });
  });

  it('tracks a new connection attempt event - recent', async function () {
    const trackEvent = once(process, 'compass:track');
    trackConnectionAttemptEvent(
      { favorite: undefined, lastUsed: new Date() }
    );
    const [ { properties } ] = await trackEvent;
    expect(properties).to.deep.equal({
      is_favorite: false,
      is_recent: true,
      is_new: false,
    });
  });

  it('tracks a new connection attempt event - new', async function () {
    const trackEvent = once(process, 'compass:track');
    trackConnectionAttemptEvent(
      { favorite: undefined, lastUsed: undefined }
    );
    const [ { properties } ] = await trackEvent;
    expect(properties).to.deep.equal({
      is_favorite: false,
      is_recent: false,
      is_new: true,
    });
  });

  it('tracks a new connection attempt event - favorite and recent', async function () {
    const trackEvent = once(process, 'compass:track');
    trackConnectionAttemptEvent(
      { favorite: { name: 'example' }, lastUsed: new Date() },
    );
    const [ { properties } ] = await trackEvent;
    expect(properties).to.deep.equal({
      is_favorite: true,
      is_recent: false,
      is_new: false,
    });
  });

  it('tracks a new connection event - localhost', async function () {
    const trackEvent = once(process, 'compass:track');
    const connectionInfo = {
      connectionOptions: {
        connectionString: 'mongodb://localhost:27017',
      },
    };

    trackNewConnectionEvent(connectionInfo, dataService);
    const [ { properties } ] = await trackEvent;
    const expected = {
      is_localhost: true,
      is_public_cloud: false,
      is_do_url: false,
      is_atlas_url: false,
      public_cloud_name: '',
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      is_atlas: false,
      is_dataLake: false,
      is_enterprise: false,
      is_genuine: true,
      non_genuine_server_name: 'na',
      server_version: 'na',
      server_arch: undefined,
      server_os_family: undefined,
    };

    expect(properties).to.deep.equal(expected);
  });

  it('tracks a new connection event - digital ocean', async function () {
    const trackEvent = once(process, 'compass:track');
    const connectionInfo = {
      connectionOptions: {
        connectionString: 'mongodb://example.mongo.ondigitalocean.com:27017',
      },
    };

    trackNewConnectionEvent(connectionInfo, dataService);
    const [ { properties } ] = await trackEvent;

    const expected = {
      is_localhost: false,
      is_public_cloud: false,
      is_do_url: true,
      is_atlas_url: false,
      public_cloud_name: '',
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      is_atlas: false,
      is_dataLake: false,
      is_enterprise: false,
      is_genuine: true,
      non_genuine_server_name: 'na',
      server_version: 'na',
      server_arch: undefined,
      server_os_family: undefined,
    };

    expect(properties).to.deep.equal(expected);
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  [
    {url: 'mongodb://compass-data-sets.e06dc.mongodb.net', is_srv: false, title: 'is atlas, no srv'},
    {url: 'mongodb://compass-data-sets.e06dc.mongodb-dev.net', is_srv: false, title: 'is dev atlas, no srv'},
    {url: 'mongodb+srv://compass-data-sets.e06dc.mongodb.net', is_srv: true, title: 'is atlas, is srv'},
    {url: 'mongodb+srv://compass-data-sets.e06dc.mongodb-dev.net', is_srv: true, title: 'is dev atlas, is srv'},
  ].forEach(({url, is_srv, title}) => {
      it(`tracks a new connection event - ${title}`, async function () {
        const trackEvent = once(process, 'compass:track');
        const connectionInfo = {
          connectionOptions: {
            connectionString: url
          },
        };
    
        trackNewConnectionEvent(connectionInfo, dataService);
        const [ { properties } ] = await trackEvent;
    
        const expected = {
          is_localhost: false,
          is_public_cloud: false,
          is_do_url: false,
          is_atlas_url: true,
          public_cloud_name: '',
          auth_type: 'NONE',
          tunnel: 'none',
          is_srv: is_srv,
          is_atlas: false,
          is_dataLake: false,
          is_enterprise: false,
          is_genuine: true,
          non_genuine_server_name: 'na',
          server_version: 'na',
          server_arch: undefined,
          server_os_family: undefined,
        };
    
        expect(properties).to.deep.equal(expected);
      });
    });

  it('tracks a new connection event - public cloud', async function () {
    const trackEvent = once(process, 'compass:track');
    const connectionInfo = {
      connectionOptions: {
        connectionString: 'mongodb://13.248.118.1',
      },
    };

    trackNewConnectionEvent(connectionInfo, dataService);
    const [ { properties } ] = await trackEvent;


    const expected = {
      is_localhost: false,
      is_public_cloud: true,
      is_do_url: false,
      is_atlas_url: false,
      public_cloud_name: 'AWS',
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      is_atlas: false,
      is_dataLake: false,
      is_enterprise: false,
      is_genuine: true,
      non_genuine_server_name: 'na',
      server_version: 'na',
      server_arch: undefined,
      server_os_family: undefined,
    };

    expect(properties).to.deep.equal(expected);
  });

  it('tracks a new connection event - public ip but not aws/gcp/azure', async function () {
    const trackEvent = once(process, 'compass:track');
    const connectionInfo = {
      connectionOptions: {
        connectionString: 'mongodb://127.128.0.0',
      },
    };

    trackNewConnectionEvent(connectionInfo, dataService);
    const [ { properties } ] = await trackEvent;


    const expected = {
      is_localhost: false,
      is_public_cloud: false,
      is_do_url: false,
      is_atlas_url: false,
      public_cloud_name: '',
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      is_atlas: false,
      is_dataLake: false,
      is_enterprise: false,
      is_genuine: true,
      non_genuine_server_name: 'na',
      server_version: 'na',
      server_arch: undefined,
      server_os_family: undefined,
    };

    expect(properties).to.deep.equal(expected);
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  ['', 'GSSAPI', 'PLAIN', 'MONGODB-X509', 'SCRAM-SHA-256'].forEach((authMechanism) => {
    it(`tracks a new connection event - ${authMechanism || 'DEFAULT'} auth`, async function () {
      const trackEvent = once(process, 'compass:track');
      const connectionInfo = {
        connectionOptions: {
          connectionString: `mongodb://root@example:127.0.0.1?authMechanism=${authMechanism}`,
        },
      };
      trackNewConnectionEvent(connectionInfo, dataService);
      const [ { properties } ] = await trackEvent;
      expect(properties.auth_type).to.equal(authMechanism || 'DEFAULT');
    });
  });

  it('tracks a new connection event - no auth', async function () {
    const trackEvent = once(process, 'compass:track');
    const connectionInfo = {
      connectionOptions: {
        connectionString: 'mongodb://127.0.0.1?authMechanism=',
      },
    };
    trackNewConnectionEvent(connectionInfo, dataService);
    const [ { properties } ] = await trackEvent;
    expect(properties.auth_type).to.equal('NONE');
  });

  it('tracks a new connection event - no tunnel', async function () {
    const trackEvent = once(process, 'compass:track');
    const connectionInfo = {
      connectionOptions: {
        connectionString: 'mongodb://127.0.0.1?authMechanism=',
      },
    };
    trackNewConnectionEvent(connectionInfo, dataService);
    const [ { properties } ] = await trackEvent;
    expect(properties.tunnel).to.equal('none');
  });

  it('tracks a new connection event - ssh tunnel', async function () {
    const trackEvent = once(process, 'compass:track');
    const connectionInfo = {
      connectionOptions: {
        connectionString: 'mongodb://127.0.0.1?authMechanism=',
        sshTunnel: {
          username: '',
          host: '',
          port: 0,
        },
      },
    };
    trackNewConnectionEvent(connectionInfo, dataService);
    const [ { properties } ] = await trackEvent;
    expect(properties.tunnel).to.equal('ssh');
  });

  it('tracks a new connection event - SRV', async function () {
    const trackEvent = once(process, 'compass:track');
    const connectionInfo = {
      connectionOptions: {
        connectionString: 'mongodb+srv://127.0.0.1',
      },
    };
    trackNewConnectionEvent(connectionInfo, dataService);
    const [ { properties } ] = await trackEvent;
    expect(properties.is_srv).to.equal(true);
  });

  it('tracks connection error event', async function () {
    const trackEvent = once(process, 'compass:track');
    const connectionInfo = {
      connectionOptions: {
        connectionString: 'mongodb://localhost:27017',
      },
    };

    const connectionError = new Error();

    trackConnectionFailedEvent(connectionInfo, connectionError);
    const [ { properties } ] = await trackEvent;

    const expected = {
      is_localhost: true,
      is_public_cloud: false,
      is_do_url: false,
      is_atlas_url: false,
      public_cloud_name: '',
      auth_type: 'NONE',
      tunnel: 'none',
      is_srv: false,
      error_code: undefined,
      error_name: 'Error',
    };

    expect(properties).to.deep.equal(expected);
  });
});
