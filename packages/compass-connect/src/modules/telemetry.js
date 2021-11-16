import { constantCase } from 'constant-case';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { isAtlas, isLocalhost, isDigitalOcean } from 'mongodb-build-info';
import { getCloudInfo } from 'mongodb-cloud-info';
import ConnectionString from 'mongodb-connection-string-url';

const { track, debug } = createLoggerAndTelemetry('COMPASS-CONNECT-UI');

async function getConnectionData(connectionInfo) {
  const {connectionOptions: {connectionString, sshTunnel}} = connectionInfo;
  const connectionStringData = new ConnectionString(connectionString);
  const hostName = connectionStringData.hosts[0];
  const { isAws, isAzure, isGcp } = await getCloudInfo(hostName).catch((err) => {
    debug('getCloudInfo failed', err);
    return {};
  });
  const isPublicCloud = isAws || isAzure || isGcp;
  const publicCloudName = isAws ? 'AWS' : isAzure ? 'Azure' : isGcp ? 'GCP' : '';
  const authMechanism = connectionStringData.searchParams.get('authMechanism');
  const authType = authMechanism
    ? authMechanism
    : connectionStringData.username
      ? 'SCRAM-SHA-1'
      : 'DEFAULT';

  return {
    is_localhost: isLocalhost(hostName),
    is_atlas: isAtlas(hostName),
    is_public_cloud: !!isPublicCloud,
    is_do: isDigitalOcean(hostName),
    public_cloud_name: publicCloudName,
    auth_type: constantCase(authType),
    is_ssh_tunnel: !!sshTunnel,
    is_srv: connectionStringData.isSRV,
  };
}

export function trackConnectionAttemptEvent(connectionInfo) {
  try {
    const { favorite, lastUsed } = connectionInfo;
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

export async function trackNewConnectionEvent(connectionInfo, dataService) {
  try {
    const callback = async() => {
      const {
        dataLake,
        genuineMongoDB,
        host,
        build,
      } = await dataService.instance();
      const connectionData = await getConnectionData(connectionInfo);
      const trackEvent = {
        ...connectionData,
        is_dataLake: dataLake.isDataLake,
        is_enterprise: build.isEnterprise,
        is_genuine: genuineMongoDB.isGenuine,
        non_genuine_server_name: genuineMongoDB.dbType,
        server_version: host.kernel_version,
        server_arch: host.arch,
        server_os_family: host.os_family,
      };
      return trackEvent;
    };
    track('New Connection', callback);
  } catch (error) {
    debug('trackNewConnectionEvent failed', error);
  }
}

export async function trackConnectionFailedEvent(connectionInfo, connectionError) {
  try {
    const callback = async() => {
      const connectionData = await getConnectionData(connectionInfo);
      const trackEvent = {
        ...connectionData,
        error_code: connectionError.code,
        error_name: connectionError.codeName ?? connectionError.name,
      };
      return trackEvent;
    };
    track('Connection Failed', callback);
  } catch (error) {
    debug('trackConnectionFailedEvent failed', error);
  }
}
