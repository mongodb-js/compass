import { ConnectionInfo, DataService } from 'mongodb-data-service';
import { createLoggerAndTelemetry, TrackFunction } from '@mongodb-js/compass-logging';
import { isLocalhost, isDigitalOcean, isAtlas } from 'mongodb-build-info';
import { getCloudInfo } from 'mongodb-cloud-info';
import ConnectionString from 'mongodb-connection-string-url';

const { track: telemetryTrack, debug } = createLoggerAndTelemetry('COMPASS-CONNECT-UI');

async function getConnectionData({
  connectionOptions: { connectionString, sshTunnel },
}: ConnectionInfo): Promise<Record<string, unknown>> {
  const connectionStringData = new ConnectionString(connectionString);
  const hostName = connectionStringData.hosts[0];
  const { isAws, isAzure, isGcp } = await getCloudInfo(hostName).catch(
    (err: Error) => {
      debug('getCloudInfo failed', err);
      return {};
    }
  );
  const isPublicCloud = isAws || isAzure || isGcp;
  const publicCloudName = isAws
    ? 'AWS'
    : isAzure
    ? 'Azure'
    : isGcp
    ? 'GCP'
    : '';
  const authMechanism = connectionStringData.searchParams.get('authMechanism');
  const authType = authMechanism
    ? authMechanism
    : connectionStringData.username
    ? 'DEFAULT'
    : 'NONE';

  return {
    is_localhost: isLocalhost(hostName),
    is_public_cloud: !!isPublicCloud,
    is_do_url: isDigitalOcean(hostName),
    is_atlas_url: isAtlas(hostName),
    public_cloud_name: publicCloudName,
    auth_type: authType.toUpperCase(),
    tunnel: sshTunnel ? 'ssh' : 'none',
    is_srv: connectionStringData.isSRV,
  };
}

export function trackConnectionAttemptEvent({
  favorite,
  lastUsed,
}: ConnectionInfo, track: TrackFunction = telemetryTrack): void {
  try {
    const trackEvent = {
      is_favorite: Boolean(favorite),
      is_recent: Boolean(lastUsed && !favorite),
      is_new: !lastUsed,
    };
    track('Connection Attempt', trackEvent);
  } catch (error) {
    debug('trackConnectionAttemptEvent failed', error);
  }
}

export function trackNewConnectionEvent(
  connectionInfo: ConnectionInfo,
  dataService: DataService
): void {
  try {
    const callback = async () => {
      const {
        dataLake,
        genuineMongoDB,
        host,
        build,
        isAtlas: isAtlasInstance,
      } = await dataService.instance();
      const connectionData = await getConnectionData(connectionInfo);
      const trackEvent = {
        ...connectionData,
        is_atlas: isAtlasInstance,
        is_dataLake: dataLake.isDataLake,
        is_enterprise: build.isEnterprise,
        is_genuine: genuineMongoDB.isGenuine,
        non_genuine_server_name: genuineMongoDB.dbType,
        server_version: build.version,
        server_arch: host.arch,
        server_os_family: host.os_family,
      };
      return trackEvent;
    };
    telemetryTrack('New Connection', callback);
  } catch (error) {
    debug('trackNewConnectionEvent failed', error);
  }
}

export function trackConnectionFailedEvent(
  connectionInfo: ConnectionInfo,
  connectionError: any
): void {
  try {
    const callback = async () => {
      const connectionData = await getConnectionData(connectionInfo);
      const trackEvent = {
        ...connectionData,
        error_code: connectionError.code,
        error_name: connectionError.codeName ?? connectionError.name,
      };
      return trackEvent;
    };
    telemetryTrack('Connection Failed', callback);
  } catch (error) {
    debug('trackConnectionFailedEvent failed', error);
  }
}
