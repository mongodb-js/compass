import { expect } from 'chai';
import { SinonSpy, spy } from 'sinon';
import { ConnectionInfo, DataService } from 'mongodb-data-service';

import {
  trackConnectionAttemptEvent,
  trackNewConnectionEvent,
  trackConnectionFailedEvent,
} from './telemetry';

let track: SinonSpy<any[], any>;

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
    track = spy();
  });

  it('tracks a new connection attempt event - favorite', function () {
    trackConnectionAttemptEvent(
      { favorite: { name: 'example' }, lastUsed: null } as ConnectionInfo,
      track
    );
    expect(track).to.have.been.calledWith('Connection Attempt', {
      is_favorite: true,
      is_recent: false,
      is_new: true,
    });
  });

  it('tracks a new connection attempt event - recent', function () {
    trackConnectionAttemptEvent(
      { favorite: undefined, lastUsed: new Date() } as ConnectionInfo,
      track
    );
    expect(track).to.have.been.calledWith('Connection Attempt', {
      is_favorite: false,
      is_recent: true,
      is_new: false,
    });
  });

  it('tracks a new connection attempt event - new', function () {
    trackConnectionAttemptEvent(
      { favorite: undefined, lastUsed: undefined } as ConnectionInfo,
      track
    );
    expect(track).to.have.been.calledWith('Connection Attempt', {
      is_favorite: false,
      is_recent: false,
      is_new: true,
    });
  });

  it('tracks a new connection attempt event - favorite and recent', function () {
    trackConnectionAttemptEvent(
      { favorite: { name: 'example' }, lastUsed: new Date() } as ConnectionInfo,
      track
    );
    expect(track).to.have.been.calledWith('Connection Attempt', {
      is_favorite: true,
      is_recent: false,
      is_new: false,
    });
  });

  it('tracks a new connection event - localhost', async function () {
    const connectionInfo = {
      connectionOptions: {
        connectionString: 'mongodb://localhost:27017',
      },
    } as ConnectionInfo;

    trackNewConnectionEvent(connectionInfo, dataService, track);

    expect(track).to.have.been.calledOnce;
    const callback = track.getCall(0).args[1];
    const response = await callback();
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

    expect(expected).to.deep.equal(response);
  });

  it('tracks a new connection event - digital ocean', async function () {
    const connectionInfo = {
      connectionOptions: {
        connectionString: 'mongodb://example.mongo.ondigitalocean.com:27017',
      },
    } as ConnectionInfo;

    trackNewConnectionEvent(connectionInfo, dataService, track);

    expect(track).to.have.been.calledOnce;
    const callback = track.getCall(0).args[1];
    const response = await callback();
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

    expect(expected).to.deep.equal(response);
  });

  it('tracks a new connection event - public cloud', async function () {
    const connectionInfo = {
      connectionOptions: {
        connectionString: 'mongodb://13.248.118.1',
      },
    } as ConnectionInfo;

    trackNewConnectionEvent(connectionInfo, dataService, track);

    expect(track).to.have.been.calledOnce;
    const callback = track.getCall(0).args[1];
    const response = await callback();
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

    expect(expected).to.deep.equal(response);
  });

  it('tracks connection error event', async function () {
    const connectionInfo = {
      connectionOptions: {
        connectionString: 'mongodb://localhost:27017',
      },
    } as ConnectionInfo;

    const connectionError = new Error('Error');

    trackConnectionFailedEvent(connectionInfo, connectionError, track);

    expect(track).to.have.been.calledOnce;
    const callback = track.getCall(0).args[1];
    const response = await callback();
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

    expect(expected).to.deep.equal(response);
  });
});
