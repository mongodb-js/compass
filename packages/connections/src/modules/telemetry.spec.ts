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

describe.only('connection tracking', function () {
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
