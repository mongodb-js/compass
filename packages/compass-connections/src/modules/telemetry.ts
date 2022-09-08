import type { ConnectionInfo, DataService } from 'mongodb-data-service';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { isLocalhost, isDigitalOcean, isAtlas } from 'mongodb-build-info';
import { getCloudInfo } from 'mongodb-cloud-info';
import ConnectionString from 'mongodb-connection-string-url';
import type { MongoServerError, MongoClientOptions } from 'mongodb';
import { configuredKMSProviders } from 'mongodb-data-service';

const { track, debug } = createLoggerAndTelemetry('COMPASS-CONNECT-UI');

async function getHostInformation(host: string) {
  if (isLocalhost(host)) {
    return {
      is_localhost: true,
    };
  }

  if (isDigitalOcean(host)) {
    return {
      is_do_url: true,
    };
  }

  const { isAws, isAzure, isGcp } = await getCloudInfo(host).catch(
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

  return {
    is_localhost: false,
    is_public_cloud: !!isPublicCloud,
    is_do_url: false,
    is_atlas_url: isAtlas(host),
    public_cloud_name: publicCloudName,
  };
}

function getCsfleInformation(
  fleOptions: ConnectionInfo['connectionOptions']['fleOptions']
): Record<string, unknown> {
  const kmsProviders = configuredKMSProviders(fleOptions?.autoEncryption ?? {});
  const csfleInfo: Record<string, unknown> = {
    is_csfle: kmsProviders.length > 0,
    has_csfle_schema: !!fleOptions?.autoEncryption?.encryptedFieldsMap,
  };

  for (const kmsProvider of ['aws', 'gcp', 'kmip', 'local', 'azure'] as const) {
    csfleInfo[`has_kms_${kmsProvider}`] =
      !!fleOptions?.autoEncryption?.kmsProviders?.[kmsProvider];
  }

  return csfleInfo;
}

async function getConnectionData({
  connectionOptions: { connectionString, sshTunnel, fleOptions },
}: Pick<ConnectionInfo, 'connectionOptions'>): Promise<
  Record<string, unknown>
> {
  const connectionStringData = new ConnectionString(connectionString, {
    looseValidation: true,
  });
  const hostName = connectionStringData.hosts[0];
  const searchParams =
    connectionStringData.typedSearchParams<MongoClientOptions>();

  const authMechanism = searchParams.get('authMechanism');
  const authType = authMechanism
    ? authMechanism
    : connectionStringData.username
    ? 'DEFAULT'
    : 'NONE';
  const proxyHost = searchParams.get('proxyHost');

  return {
    ...(await getHostInformation(hostName)),
    auth_type: authType.toUpperCase(),
    tunnel: proxyHost ? 'socks5' : sshTunnel ? 'ssh' : 'none',
    is_srv: connectionStringData.isSRV,
    ...getCsfleInformation(fleOptions),
  };
}

export function trackConnectionAttemptEvent({
  favorite,
  lastUsed,
}: Pick<ConnectionInfo, 'favorite' | 'lastUsed'>): void {
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
  connectionInfo: Pick<ConnectionInfo, 'connectionOptions'>,
  dataService: Pick<DataService, 'instance' | 'currentTopologyType'>
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
        topology_type: dataService.currentTopologyType(),
      };
      return trackEvent;
    };
    track('New Connection', callback);
  } catch (error) {
    debug('trackNewConnectionEvent failed', error);
  }
}

export function trackConnectionFailedEvent(
  connectionInfo: Pick<ConnectionInfo, 'connectionOptions'>,
  connectionError: Error & Partial<Pick<MongoServerError, 'code' | 'codeName'>>
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
    track('Connection Failed', callback);
  } catch (error) {
    debug('trackConnectionFailedEvent failed', error);
  }
}
